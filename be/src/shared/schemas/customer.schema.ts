import { z } from "zod";

export const genderSchema = z.enum(["MALE", "FEMALE", "OTHER"]);
export const customerStatusSchema = z.enum([
  "PROSPECT",
  "RESERVED",
  "ACTIVE",
  "EXPIRING",
  "CHECKED_OUT",
  "CHECKED_OUT_WITH_DEBT",
  "SUSPENDED",
  "BLACKLISTED",
]);

const emergencyContactSchema = z.object({
  name: z.string().min(1),
  relationship: z.string().optional(),
  phone: z.string().min(1),
  address: z.string().optional(),
});

/** `branchId` chỉ dùng để sinh customerCode có tiền tố chi nhánh và set
 * currentBranchId ban đầu — không phải cột thật trên bảng customers (docs/12:
 * khách thuê org-wide, không branch-scoped cứng vì có thể chuyển chi nhánh). */
export const createCustomerSchema = z.object({
  branchId: z.string().uuid(),
  fullName: z.string().min(1),
  dateOfBirth: z.string().optional(),
  gender: genderSchema,
  idType: z.enum(["CCCD", "CMND", "PASSPORT", "BIRTH_CERT"]).optional(),
  idNumber: z.string().optional(),
  phone: z.string().min(1),
  email: z.string().email().optional(),
  permanentAddress: z
    .object({ street: z.string().optional(), province: z.string().optional() })
    .optional(),
  emergencyContact: emergencyContactSchema,
  payer: z
    .object({ name: z.string().optional(), phone: z.string().optional(), relationship: z.string().optional() })
    .optional(),
  occupation: z.enum(["STUDENT", "EMPLOYEE", "OTHER"]).optional(),
  school: z.string().optional(),
  company: z.string().optional(),
  source: z.string().optional(),
});
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

export const updateCustomerSchema = createCustomerSchema.omit({ branchId: true }).partial();
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;

export const blacklistCustomerSchema = z.object({ reason: z.string().min(1) });
export type BlacklistCustomerInput = z.infer<typeof blacklistCustomerSchema>;
