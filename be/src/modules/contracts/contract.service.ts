import type { CheckOutContractInput, CreateContractInput, RequestContext } from "../../shared/index.js";
import { withRequestContext } from "../../core/db/request-context.js";
import { generateDocNo, generateSimpleNo } from "../../core/db/document-number.js";
import { writeAudit } from "../../core/audit/audit-log.js";
import { ConflictError, NotFoundError } from "../../core/errors/app-error.js";
import { branchRepository } from "../branches/branch.repository.js";
import { bedRepository } from "../beds/bed.repository.js";
import { customerRepository } from "../customers/customer.repository.js";
import { depositLedgerRepository } from "../deposits/deposit-ledger.repository.js";
import { bedAssignmentRepository } from "./bed-assignment.repository.js";
import { contractRepository, type ContractRow } from "./contract.repository.js";

export const contractService = {
  async list(ctx: RequestContext, filter: { branchId?: string; customerId?: string }): Promise<ContractRow[]> {
    return withRequestContext(ctx, (tx) => contractRepository.findMany(tx, filter));
  },

  async getById(ctx: RequestContext, id: string): Promise<ContractRow> {
    const row = await withRequestContext(ctx, (tx) => contractRepository.findById(tx, id));
    if (!row) throw new NotFoundError("Contract");
    return row;
  },

  async create(ctx: RequestContext, input: CreateContractInput): Promise<ContractRow> {
    return withRequestContext(ctx, async (tx) => {
      const branch = await branchRepository.findById(tx, input.branchId);
      if (!branch) throw new NotFoundError("Branch");

      for (const bedId of input.bedIds) {
        const open = await bedAssignmentRepository.findOpenByBedId(tx, bedId);
        if (open) throw new ConflictError(`Giường ${bedId} đang có người ở, không thể lập hợp đồng`);
      }

      const contractNo = await generateDocNo(tx, { docType: "HD", branchCode: branch.code });
      const contract = await contractRepository.create(tx, ctx.orgId, contractNo, input, ctx.userId);

      await writeAudit(tx, {
        orgId: ctx.orgId,
        branchId: input.branchId,
        actorId: ctx.userId,
        actorName: ctx.userId,
        actorRole: ctx.scope,
        action: "contract.create",
        entity: "contracts",
        entityId: contract.id,
        after: { contractNo: contract.contractNo, customerId: contract.customerId, bedIds: contract.bedIds },
      });

      return contract;
    });
  },

  /** docs/08 §3: check-in mở bed_assignments cho từng giường, kích hoạt hợp đồng, tạo bút toán cọc HOLD. */
  async checkIn(ctx: RequestContext, contractId: string): Promise<ContractRow> {
    return withRequestContext(ctx, async (tx) => {
      const contract = await contractRepository.findById(tx, contractId);
      if (!contract) throw new NotFoundError("Contract");
      if (contract.status !== "DRAFT" && contract.status !== "PENDING_APPROVAL") {
        throw new ConflictError(`Hợp đồng đang ở trạng thái ${contract.status}, không thể check-in`);
      }

      let lastBedId = "";
      for (const bedId of contract.bedIds) {
        lastBedId = bedId;
        const existing = await bedAssignmentRepository.findOpenByBedId(tx, bedId);
        if (existing) throw new ConflictError(`Giường ${bedId} đang có người ở`);

        const bed = await bedRepository.findById(tx, bedId);
        if (!bed) throw new NotFoundError("Bed");

        const assignment = await bedAssignmentRepository.create(tx, {
          orgId: ctx.orgId,
          branchId: contract.branchId,
          contractId: contract.id,
          customerId: contract.customerId,
          bedId: bed.id,
          roomId: bed.roomId,
          floorId: bed.floorId,
          buildingId: bed.buildingId,
          startDate: contract.startDate,
          reason: "CHECK_IN",
          dailyRate: contract.monthlyRent / 30n,
          monthlyRate: contract.monthlyRent,
          createdBy: ctx.userId,
        });

        await bedRepository.attachAssignment(tx, bed.id, "OCCUPIED", assignment.id, ctx.userId);
      }

      await customerRepository.setCurrentAssignment(tx, contract.customerId, {
        status: "ACTIVE",
        currentBranchId: contract.branchId,
        currentBedId: lastBedId,
        currentContractId: contract.id,
      });

      const after = await contractRepository.updateStatus(tx, contractId, "ACTIVE");
      if (!after) throw new NotFoundError("Contract");

      if (contract.depositAmount > 0n) {
        const entryNo = await generateSimpleNo(tx, { docType: "COC" });
        await depositLedgerRepository.addEntry(tx, {
          orgId: ctx.orgId,
          branchId: contract.branchId,
          contractId: contract.id,
          customerId: contract.customerId,
          entryNo,
          entryType: "HOLD",
          amount: contract.depositAmount,
          reason: "Tiền cọc nhận khi check-in",
          status: "EXECUTED",
          executedBy: ctx.userId,
        });
      }

      await writeAudit(tx, {
        orgId: ctx.orgId,
        branchId: contract.branchId,
        actorId: ctx.userId,
        actorName: ctx.userId,
        actorRole: ctx.scope,
        action: "contract.check_in",
        entity: "contracts",
        entityId: contractId,
        after: { status: "ACTIVE", bedIds: contract.bedIds },
      });

      return after;
    });
  },

  /** docs/08 §4: check-out đóng bed_assignments, trả giường về CLEANING, chấm dứt hợp đồng. */
  async checkOut(ctx: RequestContext, contractId: string, input: CheckOutContractInput): Promise<ContractRow> {
    return withRequestContext(ctx, async (tx) => {
      const contract = await contractRepository.findById(tx, contractId);
      if (!contract) throw new NotFoundError("Contract");
      if (contract.status !== "ACTIVE" && contract.status !== "EXPIRING") {
        throw new ConflictError(`Hợp đồng đang ở trạng thái ${contract.status}, không thể check-out`);
      }

      const openAssignments = await bedAssignmentRepository.findOpenByContractId(tx, contractId);
      for (const assignment of openAssignments) {
        await bedAssignmentRepository.close(tx, assignment.id, input.checkOutDate);
        await bedRepository.attachAssignment(tx, assignment.bedId, "CLEANING", null, ctx.userId);
      }

      await customerRepository.setCurrentAssignment(tx, contract.customerId, {
        status: "CHECKED_OUT",
        currentBedId: null,
        currentContractId: null,
      });

      const after = await contractRepository.updateStatus(tx, contractId, "TERMINATED", {
        terminatedAt: new Date(),
        terminationReason: input.terminationReason,
        terminationType: input.terminationType,
      });
      if (!after) throw new NotFoundError("Contract");

      await writeAudit(tx, {
        orgId: ctx.orgId,
        branchId: contract.branchId,
        actorId: ctx.userId,
        actorName: ctx.userId,
        actorRole: ctx.scope,
        action: "contract.check_out",
        entity: "contracts",
        entityId: contractId,
        reason: input.terminationReason,
        after: { status: "TERMINATED", terminationType: input.terminationType },
      });

      return after;
    });
  },
};
