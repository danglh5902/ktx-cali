import { and, eq, ilike, isNull, or } from "drizzle-orm";
import type { CreateCustomerInput, UpdateCustomerInput } from "../../shared/index.js";
import { customers } from "../../core/db/schema/index.js";
import type { Tx } from "../../core/db/request-context.js";

export type CustomerRow = typeof customers.$inferSelect;

export const customerRepository = {
  async findMany(tx: Tx, filter: { search?: string; bedId?: string } = {}): Promise<CustomerRow[]> {
    const conditions = [isNull(customers.deletedAt)];
    if (filter.search) {
      conditions.push(
        or(ilike(customers.fullName, `%${filter.search}%`), ilike(customers.phone, `%${filter.search}%`))!,
      );
    }
    if (filter.bedId) conditions.push(eq(customers.currentBedId, filter.bedId));
    return tx.select().from(customers).where(and(...conditions));
  },

  async findById(tx: Tx, id: string): Promise<CustomerRow | null> {
    const [row] = await tx
      .select()
      .from(customers)
      .where(and(eq(customers.id, id), isNull(customers.deletedAt)))
      .limit(1);
    return row ?? null;
  },

  async create(
    tx: Tx,
    orgId: string,
    customerCode: string,
    branchId: string,
    input: CreateCustomerInput,
    actorId: string,
  ): Promise<CustomerRow> {
    const [row] = await tx
      .insert(customers)
      .values({
        orgId,
        customerCode,
        fullName: input.fullName,
        dateOfBirth: input.dateOfBirth,
        gender: input.gender,
        idType: input.idType,
        idNumber: input.idNumber,
        phone: input.phone,
        email: input.email,
        permanentAddress: input.permanentAddress,
        emergencyContact: input.emergencyContact,
        payer: input.payer,
        occupation: input.occupation,
        school: input.school,
        company: input.company,
        source: input.source,
        currentBranchId: branchId,
        status: "PROSPECT",
        creditBalance: 0n,
        createdBy: actorId,
        updatedBy: actorId,
      })
      .returning();
    if (!row) throw new Error("customer insert returned no row");
    return row;
  },

  async update(tx: Tx, id: string, input: UpdateCustomerInput, actorId: string): Promise<CustomerRow | null> {
    const [row] = await tx
      .update(customers)
      .set({ ...input, updatedBy: actorId, updatedAt: new Date() })
      .where(and(eq(customers.id, id), isNull(customers.deletedAt)))
      .returning();
    return row ?? null;
  },

  async setBlacklisted(tx: Tx, id: string, reason: string, actorId: string): Promise<CustomerRow | null> {
    const [row] = await tx
      .update(customers)
      .set({
        isBlacklisted: true,
        blacklistReason: reason,
        blacklistedAt: new Date(),
        status: "BLACKLISTED",
        updatedBy: actorId,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, id))
      .returning();
    return row ?? null;
  },

  /** Dùng khi check-in/check-out — cập nhật vị trí/hợp đồng/trạng thái hiện tại. */
  async setCurrentAssignment(
    tx: Tx,
    id: string,
    fields: {
      status: CustomerRow["status"];
      currentBranchId?: string | null;
      currentRoomId?: string | null;
      currentBedId?: string | null;
      currentContractId?: string | null;
    },
  ): Promise<void> {
    await tx.update(customers).set(fields).where(eq(customers.id, id));
  },
};
