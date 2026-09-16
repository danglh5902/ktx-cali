import { z } from "zod";

/**
 * VND is transmitted over JSON as a decimal string (bigint isn't JSON-safe) —
 * see docs/11-architecture.md §4. `vndString` validates that convention.
 */
export const vndString = z
  .string()
  .regex(/^-?\d+$/, "Số tiền phải là chuỗi số nguyên (đơn vị đồng)");

export const branchStatusSchema = z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]);
export const genderPolicySchema = z.enum(["MALE", "FEMALE", "MIXED"]);

export const branchAddressSchema = z.object({
  street: z.string().min(1),
  ward: z.string().optional(),
  district: z.string().optional(),
  province: z.string().min(1),
});

export const createBranchSchema = z.object({
  code: z
    .string()
    .min(1)
    .max(10)
    .regex(/^[A-Z0-9]+$/, "Mã chi nhánh chỉ gồm chữ hoa và số, bất biến sau khi tạo"),
  name: z.string().min(1),
  shortName: z.string().optional(),
  address: branchAddressSchema,
  region: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  genderPolicy: genderPolicySchema.default("MIXED"),
  billingDayOfMonth: z.number().int().min(1).max(31).default(28),
  dueDayOfMonth: z.number().int().min(1).max(31).default(10),
});
export type CreateBranchInput = z.infer<typeof createBranchSchema>;

export const updateBranchSchema = createBranchSchema
  .omit({ code: true })
  .partial();
export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;

export const branchSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  shortName: z.string().nullable(),
  address: branchAddressSchema.nullable(),
  region: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  genderPolicy: genderPolicySchema,
  billingDayOfMonth: z.number().int(),
  dueDayOfMonth: z.number().int(),
  status: branchStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Branch = z.infer<typeof branchSchema>;
