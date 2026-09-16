/**
 * Nhóm 1 — Tổ chức & Phân quyền. See docs/12-database-schema.md.
 */
import {
  boolean,
  date,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { auditColumns, deletedAt, id, money } from "./_shared.js";

export const organizations = pgTable("organizations", {
  id: id(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  taxCode: text("tax_code"),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  logo: text("logo"),
  settings: jsonb("settings").$type<Record<string, unknown>>(),
  status: text("status").notNull().default("ACTIVE"),
  ...auditColumns,
  deletedAt: deletedAt(),
}, (t) => ({
  codeUnique: uniqueIndex("organizations_code_key").on(t.code),
}));

export const branches = pgTable("branches", {
  id: id(),
  orgId: uuid("org_id").notNull().references(() => organizations.id),
  code: text("code").notNull(),
  name: text("name").notNull(),
  shortName: text("short_name"),
  address: jsonb("address").$type<{ street: string; ward?: string; district?: string; province: string }>(),
  geo: jsonb("geo").$type<{ lat: number; lng: number }>(),
  region: text("region"),
  phone: text("phone"),
  email: text("email"),
  zaloOaId: text("zalo_oa_id"),
  managerId: uuid("manager_id"),
  openingHours: jsonb("opening_hours"),
  curfewTime: text("curfew_time"),
  genderPolicy: text("gender_policy").notNull().default("MIXED"),
  billingDayOfMonth: integer("billing_day_of_month").notNull().default(28),
  dueDayOfMonth: integer("due_day_of_month").notNull().default(10),
  lateFeePolicy: jsonb("late_fee_policy"),
  depositPolicy: jsonb("deposit_policy"),
  approvalLimits: jsonb("approval_limits").$type<{
    discount?: string;
    refund?: string;
    writeOff?: string;
    expense?: string;
    cashVariance?: string;
  }>(),
  electricityPrice: money("electricity_price"),
  waterPrice: money("water_price"),
  utilityBillingMode: jsonb("utility_billing_mode"),
  waterPerPersonAmount: money("water_per_person_amount"),
  amenities: text("amenities").array(),
  images: text("images").array(),
  description: text("description"),
  notes: text("notes"),
  status: text("status").notNull().default("ACTIVE"),
  openedAt: date("opened_at"),
  closedAt: date("closed_at"),
  ...auditColumns,
  deletedAt: deletedAt(),
}, (t) => ({
  orgCodeUnique: uniqueIndex("branches_org_id_code_key").on(t.orgId, t.code),
}));

export const buildings = pgTable("buildings", {
  id: id(),
  orgId: uuid("org_id").notNull(),
  branchId: uuid("branch_id").notNull().references(() => branches.id),
  code: text("code").notNull(),
  name: text("name").notNull(),
  genderPolicy: text("gender_policy"),
  hasElevator: boolean("has_elevator").notNull().default(false),
  amenities: text("amenities").array(),
  monthlyRentCost: money("monthly_rent_cost"),
  mainElectricMeterId: uuid("main_electric_meter_id"),
  mainWaterMeterId: uuid("main_water_meter_id"),
  address: text("address"),
  images: text("images").array(),
  notes: text("notes"),
  status: text("status").notNull().default("ACTIVE"),
  ...auditColumns,
  deletedAt: deletedAt(),
}, (t) => ({
  branchCodeUnique: uniqueIndex("buildings_branch_id_code_key").on(t.branchId, t.code),
}));

export const floors = pgTable("floors", {
  id: id(),
  orgId: uuid("org_id").notNull(),
  branchId: uuid("branch_id").notNull().references(() => branches.id),
  buildingId: uuid("building_id").notNull().references(() => buildings.id),
  number: text("number").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  name: text("name"),
  genderPolicy: text("gender_policy"),
  layoutImage: text("layout_image"),
  status: text("status").notNull().default("ACTIVE"),
  ...auditColumns,
  deletedAt: deletedAt(),
}, (t) => ({
  buildingNumberUnique: uniqueIndex("floors_building_id_number_key").on(t.buildingId, t.number),
}));

export const roomTypes = pgTable("room_types", {
  id: id(),
  orgId: uuid("org_id").notNull(),
  branchId: uuid("branch_id").notNull().references(() => branches.id),
  code: text("code").notNull(),
  name: text("name").notNull(),
  capacity: integer("capacity").notNull(),
  basePrice: money("base_price").notNull(),
  /** Giá mặc định theo vị trí giường tầng — NULL thì rơi về `basePrice` (xem resolveBedPrice). */
  bunkLowerPrice: money("bunk_lower_price"),
  bunkUpperPrice: money("bunk_upper_price"),
  wholeRoomPrice: money("whole_room_price"),
  defaultAmenities: text("default_amenities").array(),
  description: text("description"),
  status: text("status").notNull().default("ACTIVE"),
  ...auditColumns,
  deletedAt: deletedAt(),
}, (t) => ({
  branchCodeUnique: uniqueIndex("room_types_branch_id_code_key").on(t.branchId, t.code),
}));

export const rooms = pgTable("rooms", {
  id: id(),
  orgId: uuid("org_id").notNull(),
  branchId: uuid("branch_id").notNull().references(() => branches.id),
  buildingId: uuid("building_id").notNull().references(() => buildings.id),
  floorId: uuid("floor_id").notNull().references(() => floors.id),
  code: text("code").notNull(),
  name: text("name"),
  roomTypeId: uuid("room_type_id").references(() => roomTypes.id),
  capacity: integer("capacity").notNull(),
  actualBedCount: integer("actual_bed_count").notNull().default(0),
  areaM2: text("area_m2"),
  priceOverride: money("price_override"),
  /** Ghi đè giá theo vị trí giường tầng cho riêng phòng này — ưu tiên hơn `room_types.bunk_*_price`. */
  bunkLowerPriceOverride: money("bunk_lower_price_override"),
  bunkUpperPriceOverride: money("bunk_upper_price_override"),
  wholeRoomPrice: money("whole_room_price"),
  amenities: text("amenities").array(),
  hasPrivateToilet: boolean("has_private_toilet").notNull().default(false),
  direction: text("direction"),
  electricMeterId: uuid("electric_meter_id"),
  waterMeterId: uuid("water_meter_id"),
  sharedMeterGroupId: uuid("shared_meter_group_id"),
  images: text("images").array(),
  notes: text("notes"),
  status: text("status").notNull().default("ACTIVE"),
  ...auditColumns,
  deletedAt: deletedAt(),
}, (t) => ({
  branchCodeUnique: uniqueIndex("rooms_branch_id_code_key").on(t.branchId, t.code),
}));

export const beds = pgTable("beds", {
  id: id(),
  orgId: uuid("org_id").notNull(),
  branchId: uuid("branch_id").notNull().references(() => branches.id),
  buildingId: uuid("building_id").notNull().references(() => buildings.id),
  floorId: uuid("floor_id").notNull().references(() => floors.id),
  roomId: uuid("room_id").notNull().references(() => rooms.id),
  code: text("code").notNull(),
  label: text("label"),
  bedType: text("bed_type").notNull().default("SINGLE"),
  priceOverride: money("price_override"),
  status: text("status").notNull().default("AVAILABLE"),
  currentAssignmentId: uuid("current_assignment_id"),
  blockedReason: text("blocked_reason"),
  blockedUntil: timestamp("blocked_until", { withTimezone: true }),
  notes: text("notes"),
  ...auditColumns,
  deletedAt: deletedAt(),
}, (t) => ({
  branchCodeUnique: uniqueIndex("beds_branch_id_code_key").on(t.branchId, t.code),
}));

/** Mirrors `auth.users` 1-1 — id IS the Supabase Auth user id. See docs/12. */
export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  orgId: uuid("org_id").notNull(),
  email: text("email"),
  phone: text("phone"),
  userType: text("user_type").notNull(),
  staffId: uuid("staff_id"),
  customerId: uuid("customer_id"),
  fullName: text("full_name"),
  avatar: text("avatar"),
  status: text("status").notNull().default("ACTIVE"),
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  lastLoginIp: text("last_login_ip"),
  failedLoginCount: integer("failed_login_count").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
  notificationPreferences: jsonb("notification_preferences"),
  ...auditColumns,
  deletedAt: deletedAt(),
}, (t) => ({
  emailUnique: uniqueIndex("users_email_key").on(t.email),
  phoneUnique: uniqueIndex("users_phone_key").on(t.phone),
}));

export const roles = pgTable("roles", {
  id: id(),
  orgId: uuid("org_id").notNull(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  permissions: text("permissions").array().notNull().default([]),
  limits: jsonb("limits").$type<Record<string, string>>(),
  isSystem: boolean("is_system").notNull().default(false),
  status: text("status").notNull().default("ACTIVE"),
  ...auditColumns,
  deletedAt: deletedAt(),
}, (t) => ({
  orgCodeUnique: uniqueIndex("roles_org_id_code_key").on(t.orgId, t.code),
}));

export const userRoleAssignments = pgTable("user_role_assignments", {
  id: id(),
  orgId: uuid("org_id").notNull(),
  userId: uuid("user_id").notNull().references(() => users.id),
  roleId: uuid("role_id").notNull().references(() => roles.id),
  scope: text("scope").notNull().default("BRANCH"),
  branchIds: uuid("branch_ids").array().notNull().default([]),
  validFrom: timestamp("valid_from", { withTimezone: true }).notNull().defaultNow(),
  validUntil: timestamp("valid_until", { withTimezone: true }),
  grantedBy: uuid("granted_by"),
  grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
  revokedBy: uuid("revoked_by"),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  revokeReason: text("revoke_reason"),
});

export const staff = pgTable("staff", {
  id: id(),
  orgId: uuid("org_id").notNull(),
  employeeCode: text("employee_code").notNull(),
  fullName: text("full_name").notNull(),
  dateOfBirth: date("date_of_birth"),
  gender: text("gender"),
  idNumber: text("id_number"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  position: text("position"),
  department: text("department"),
  branchIds: uuid("branch_ids").array().notNull().default([]),
  primaryBranchId: uuid("primary_branch_id").references(() => branches.id),
  hireDate: date("hire_date"),
  terminationDate: date("termination_date"),
  terminationReason: text("termination_reason"),
  emergencyContact: jsonb("emergency_contact"),
  documents: jsonb("documents").$type<unknown[]>(),
  status: text("status").notNull().default("ACTIVE"),
  ...auditColumns,
  deletedAt: deletedAt(),
}, (t) => ({
  orgEmployeeCodeUnique: uniqueIndex("staff_org_id_employee_code_key").on(t.orgId, t.employeeCode),
}));
