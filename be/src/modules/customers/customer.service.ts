import type {
  BlacklistCustomerInput,
  CreateCustomerInput,
  RequestContext,
  UpdateCustomerInput,
} from "../../shared/index.js";
import { withRequestContext } from "../../core/db/request-context.js";
import { generateSimpleNo } from "../../core/db/document-number.js";
import { writeAudit } from "../../core/audit/audit-log.js";
import { NotFoundError } from "../../core/errors/app-error.js";
import { customerRepository, type CustomerRow } from "./customer.repository.js";

export const customerService = {
  async list(ctx: RequestContext, filter: { search?: string; bedId?: string } = {}): Promise<CustomerRow[]> {
    return withRequestContext(ctx, (tx) => customerRepository.findMany(tx, filter));
  },

  async getById(ctx: RequestContext, id: string): Promise<CustomerRow> {
    const row = await withRequestContext(ctx, (tx) => customerRepository.findById(tx, id));
    if (!row) throw new NotFoundError("Customer");
    return row;
  },

  async create(ctx: RequestContext, input: CreateCustomerInput): Promise<CustomerRow> {
    return withRequestContext(ctx, async (tx) => {
      const customerCode = await generateSimpleNo(tx, { docType: "KH" });
      const customer = await customerRepository.create(tx, ctx.orgId, customerCode, input.branchId, input, ctx.userId);

      await writeAudit(tx, {
        orgId: ctx.orgId,
        branchId: input.branchId,
        actorId: ctx.userId,
        actorName: ctx.userId,
        actorRole: ctx.scope,
        action: "customer.create",
        entity: "customers",
        entityId: customer.id,
        after: { customerCode: customer.customerCode, fullName: customer.fullName },
      });

      return customer;
    });
  },

  async update(ctx: RequestContext, id: string, input: UpdateCustomerInput): Promise<CustomerRow> {
    return withRequestContext(ctx, async (tx) => {
      const before = await customerRepository.findById(tx, id);
      if (!before) throw new NotFoundError("Customer");

      const after = await customerRepository.update(tx, id, input, ctx.userId);
      if (!after) throw new NotFoundError("Customer");

      await writeAudit(tx, {
        orgId: ctx.orgId,
        branchId: after.currentBranchId,
        actorId: ctx.userId,
        actorName: ctx.userId,
        actorRole: ctx.scope,
        action: "customer.update",
        entity: "customers",
        entityId: id,
        before: { fullName: before.fullName, phone: before.phone },
        after: { fullName: after.fullName, phone: after.phone },
      });

      return after;
    });
  },

  /** docs/01 §6.3: khách bỏ trốn/gây rối — cảnh báo khi đăng ký lại. */
  async blacklist(ctx: RequestContext, id: string, input: BlacklistCustomerInput): Promise<CustomerRow> {
    return withRequestContext(ctx, async (tx) => {
      const before = await customerRepository.findById(tx, id);
      if (!before) throw new NotFoundError("Customer");

      const after = await customerRepository.setBlacklisted(tx, id, input.reason, ctx.userId);
      if (!after) throw new NotFoundError("Customer");

      await writeAudit(tx, {
        orgId: ctx.orgId,
        branchId: after.currentBranchId,
        actorId: ctx.userId,
        actorName: ctx.userId,
        actorRole: ctx.scope,
        action: "customer.blacklist",
        entity: "customers",
        entityId: id,
        reason: input.reason,
      });

      return after;
    });
  },
};
