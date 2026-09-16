import type { CancelBookingInput, CreateBookingInput, RequestContext } from "../../shared/index.js";
import { withRequestContext } from "../../core/db/request-context.js";
import { generateDocNo } from "../../core/db/document-number.js";
import { writeAudit } from "../../core/audit/audit-log.js";
import { ConflictError, NotFoundError } from "../../core/errors/app-error.js";
import { branchRepository } from "../branches/branch.repository.js";
import { bookingRepository, type BookingRow } from "./booking.repository.js";

export const bookingService = {
  async list(ctx: RequestContext, filter: { branchId?: string; customerId?: string }): Promise<BookingRow[]> {
    return withRequestContext(ctx, (tx) => bookingRepository.findMany(tx, filter));
  },

  async getById(ctx: RequestContext, id: string): Promise<BookingRow> {
    const row = await withRequestContext(ctx, (tx) => bookingRepository.findById(tx, id));
    if (!row) throw new NotFoundError("Booking");
    return row;
  },

  async create(ctx: RequestContext, input: CreateBookingInput): Promise<BookingRow> {
    return withRequestContext(ctx, async (tx) => {
      const branch = await branchRepository.findById(tx, input.branchId);
      if (!branch) throw new NotFoundError("Branch");

      const bookingNo = await generateDocNo(tx, { docType: "DC", branchCode: branch.code });
      const holdUntil = new Date(Date.now() + input.holdHours * 60 * 60 * 1000);

      const booking = await bookingRepository.create(tx, ctx.orgId, bookingNo, input, holdUntil, ctx.userId);

      await writeAudit(tx, {
        orgId: ctx.orgId,
        branchId: input.branchId,
        actorId: ctx.userId,
        actorName: ctx.userId,
        actorRole: ctx.scope,
        action: "booking.create",
        entity: "bookings",
        entityId: booking.id,
        after: { bookingNo: booking.bookingNo, customerId: booking.customerId },
      });

      return booking;
    });
  },

  async cancel(ctx: RequestContext, id: string, input: CancelBookingInput): Promise<BookingRow> {
    return withRequestContext(ctx, async (tx) => {
      const before = await bookingRepository.findById(tx, id);
      if (!before) throw new NotFoundError("Booking");
      if (before.status === "CHECKED_IN") {
        throw new ConflictError("Booking đã check-in, không thể hủy");
      }

      const after = await bookingRepository.updateStatus(tx, id, "CANCELLED", {
        cancelReason: input.reason,
        cancelledBy: ctx.userId,
      });
      if (!after) throw new NotFoundError("Booking");

      await writeAudit(tx, {
        orgId: ctx.orgId,
        branchId: after.branchId,
        actorId: ctx.userId,
        actorName: ctx.userId,
        actorRole: ctx.scope,
        action: "booking.cancel",
        entity: "bookings",
        entityId: id,
        reason: input.reason,
      });

      return after;
    });
  },
};
