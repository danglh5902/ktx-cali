import type { CreateBranchInput, RequestContext, UpdateBranchInput } from "../../shared/index.js";
import { withRequestContext } from "../../core/db/request-context.js";
import { writeAudit } from "../../core/audit/audit-log.js";
import { ConflictError, NotFoundError } from "../../core/errors/app-error.js";
import { branchRepository, type BranchRow } from "./branch.repository.js";

export const branchService = {
  async list(ctx: RequestContext): Promise<BranchRow[]> {
    return withRequestContext(ctx, (tx) => branchRepository.findMany(tx));
  },

  async getById(ctx: RequestContext, id: string): Promise<BranchRow> {
    const branch = await withRequestContext(ctx, (tx) => branchRepository.findById(tx, id));
    if (!branch) throw new NotFoundError("Branch");
    return branch;
  },

  async create(ctx: RequestContext, input: CreateBranchInput): Promise<BranchRow> {
    return withRequestContext(ctx, async (tx) => {
      const existing = await branchRepository.findByCode(tx, ctx.orgId, input.code);
      if (existing) {
        throw new ConflictError(`Branch code "${input.code}" already exists`);
      }

      const branch = await branchRepository.create(tx, ctx.orgId, input, ctx.userId);

      await writeAudit(tx, {
        orgId: ctx.orgId,
        branchId: branch.id,
        actorId: ctx.userId,
        actorName: ctx.userId,
        actorRole: ctx.scope,
        action: "branch.create",
        entity: "branches",
        entityId: branch.id,
        after: { code: branch.code, name: branch.name },
      });

      return branch;
    });
  },

  async update(ctx: RequestContext, id: string, input: UpdateBranchInput): Promise<BranchRow> {
    return withRequestContext(ctx, async (tx) => {
      const before = await branchRepository.findById(tx, id);
      if (!before) throw new NotFoundError("Branch");

      const after = await branchRepository.update(tx, id, input, ctx.userId);
      if (!after) throw new NotFoundError("Branch");

      await writeAudit(tx, {
        orgId: ctx.orgId,
        branchId: id,
        actorId: ctx.userId,
        actorName: ctx.userId,
        actorRole: ctx.scope,
        action: "branch.update",
        entity: "branches",
        entityId: id,
        before: { name: before.name, status: before.status },
        after: { name: after.name, status: after.status },
      });

      return after;
    });
  },

  /**
   * Chỉ chuyển ARCHIVED — không hard delete. Docs/06 §1.6 yêu cầu 0 hợp đồng
   * hoạt động / 0 công nợ / 0 cọc chưa hoàn trước khi cho archive; việc kiểm
   * tra đó cần module contracts/invoices/deposit_ledger (chưa xây ở lần
   * này) nên tạm để lại TODO thay vì âm thầm bỏ qua ràng buộc.
   */
  async archive(ctx: RequestContext, id: string): Promise<BranchRow> {
    return withRequestContext(ctx, async (tx) => {
      const before = await branchRepository.findById(tx, id);
      if (!before) throw new NotFoundError("Branch");

      // TODO(docs/06 §1.6): chặn archive nếu còn hợp đồng ACTIVE / công nợ /
      // cọc chưa hoàn — cần branchRepository join sang contracts/invoices/
      // deposit_ledger khi các module đó được xây.

      const after = await branchRepository.archive(tx, id, ctx.userId);
      if (!after) throw new NotFoundError("Branch");

      await writeAudit(tx, {
        orgId: ctx.orgId,
        branchId: id,
        actorId: ctx.userId,
        actorName: ctx.userId,
        actorRole: ctx.scope,
        action: "branch.archive",
        entity: "branches",
        entityId: id,
        before: { status: before.status },
        after: { status: after.status },
      });

      return after;
    });
  },
};
