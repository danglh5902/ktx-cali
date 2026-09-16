import { and, eq, isNull } from "drizzle-orm";
import type { CreateBookingInput } from "../../shared/index.js";
import { bookings } from "../../core/db/schema/index.js";
import type { Tx } from "../../core/db/request-context.js";

export type BookingRow = typeof bookings.$inferSelect;

export const bookingRepository = {
  async findMany(tx: Tx, filter: { branchId?: string; customerId?: string } = {}): Promise<BookingRow[]> {
    const conditions = [isNull(bookings.deletedAt)];
    if (filter.branchId) conditions.push(eq(bookings.branchId, filter.branchId));
    if (filter.customerId) conditions.push(eq(bookings.customerId, filter.customerId));
    return tx.select().from(bookings).where(and(...conditions));
  },

  async findById(tx: Tx, id: string): Promise<BookingRow | null> {
    const [row] = await tx
      .select()
      .from(bookings)
      .where(and(eq(bookings.id, id), isNull(bookings.deletedAt)))
      .limit(1);
    return row ?? null;
  },

  async create(
    tx: Tx,
    orgId: string,
    bookingNo: string,
    input: CreateBookingInput,
    holdUntil: Date,
    actorId: string,
  ): Promise<BookingRow> {
    const [row] = await tx
      .insert(bookings)
      .values({
        orgId,
        branchId: input.branchId,
        bookingNo,
        customerId: input.customerId,
        bedId: input.bedId,
        roomId: input.roomId,
        expectedCheckInDate: input.expectedCheckInDate,
        expectedDurationMonths: input.expectedDurationMonths,
        quotedPrice: input.quotedPrice ? BigInt(input.quotedPrice) : undefined,
        depositRequired: input.depositRequired ? BigInt(input.depositRequired) : undefined,
        depositPaid: 0n,
        holdUntil,
        source: input.source,
        roommatePreferences: input.roommatePreferences,
        status: "NEW",
        createdBy: actorId,
        updatedBy: actorId,
      })
      .returning();
    if (!row) throw new Error("booking insert returned no row");
    return row;
  },

  async updateStatus(
    tx: Tx,
    id: string,
    status: BookingRow["status"],
    extra: { cancelReason?: string; cancelledBy?: string; contractId?: string } = {},
  ): Promise<BookingRow | null> {
    const [row] = await tx
      .update(bookings)
      .set({
        status,
        cancelReason: extra.cancelReason,
        cancelledBy: extra.cancelledBy,
        cancelledAt: extra.cancelReason ? new Date() : undefined,
        contractId: extra.contractId,
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, id))
      .returning();
    return row ?? null;
  },
};
