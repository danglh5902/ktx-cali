/**
 * Nhóm 4 — Điện nước & Dịch vụ. See docs/12-database-schema.md.
 */
import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { branches, buildings } from "./org-permissions.js";
import { billingPeriods } from "./finance.js";
import { contracts, customers } from "./tenancy.js";
import { id, money } from "./_shared.js";

export const utilityMeters = pgTable("utility_meters", {
  id: id(),
  orgId: uuid("org_id").notNull(),
  branchId: uuid("branch_id").notNull().references(() => branches.id),
  buildingId: uuid("building_id").references(() => buildings.id),
  code: text("code").notNull(),
  serialNumber: text("serial_number"),
  type: text("type").notNull(),
  scope: text("scope").notNull(),
  roomIds: uuid("room_ids").array(),
  sharingRule: jsonb("sharing_rule"),
  multiplier: numeric("multiplier").notNull().default("1"),
  maxReading: integer("max_reading"),
  installedAt: date("installed_at"),
  replacedAt: date("replaced_at"),
  replacedByMeterId: uuid("replaced_by_meter_id"),
  status: text("status").notNull().default("ACTIVE"),
}, (t) => ({
  branchCodeUnique: uniqueIndex("utility_meters_branch_id_code_key").on(t.branchId, t.code),
}));

export const utilityReadings = pgTable("utility_readings", {
  id: id(),
  orgId: uuid("org_id").notNull(),
  branchId: uuid("branch_id").notNull(),
  meterId: uuid("meter_id").notNull().references(() => utilityMeters.id),
  roomId: uuid("room_id").notNull(),
  billingPeriodId: uuid("billing_period_id").notNull().references(() => billingPeriods.id),
  previousReading: numeric("previous_reading").notNull(),
  currentReading: numeric("current_reading").notNull(),
  consumption: numeric("consumption").notNull(),
  isRollover: boolean("is_rollover").notNull().default(false),
  isMeterReplaced: boolean("is_meter_replaced").notNull().default(false),
  unitPrice: money("unit_price").notNull(),
  amount: money("amount"),
  readingDate: date("reading_date").notNull(),
  photoUrl: text("photo_url").notNull(),
  recordedBy: uuid("recorded_by"),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
  status: text("status").notNull().default("DRAFT"),
  approvedBy: uuid("approved_by"),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  isAbnormal: boolean("is_abnormal").notNull().default(false),
  abnormalNote: text("abnormal_note"),
  isEstimated: boolean("is_estimated").notNull().default(false),
  estimationBasis: text("estimation_basis"),
  adjustedFromReadingId: uuid("adjusted_from_reading_id"),
}, (t) => ({
  meterPeriodUnique: uniqueIndex("utility_readings_meter_id_billing_period_id_key").on(
    t.meterId,
    t.billingPeriodId,
  ),
}));

export const services = pgTable("services", {
  id: id(),
  orgId: uuid("org_id").notNull(),
  branchId: uuid("branch_id").notNull().references(() => branches.id),
  code: text("code").notNull(),
  name: text("name").notNull(),
  category: text("category"),
  price: money("price").notNull(),
  unit: text("unit"),
  billingType: text("billing_type").notNull(),
  cycle: text("cycle"),
  prorateOnStart: boolean("prorate_on_start").notNull().default(true),
  prorateOnCancel: boolean("prorate_on_cancel").notNull().default(true),
  isIncludedByDefault: boolean("is_included_by_default").notNull().default(false),
  requiresApproval: boolean("requires_approval").notNull().default(false),
  status: text("status").notNull().default("ACTIVE"),
}, (t) => ({
  branchCodeUnique: uniqueIndex("services_branch_id_code_key").on(t.branchId, t.code),
}));

export const serviceSubscriptions = pgTable("service_subscriptions", {
  id: id(),
  orgId: uuid("org_id").notNull(),
  branchId: uuid("branch_id").notNull(),
  contractId: uuid("contract_id").notNull().references(() => contracts.id),
  customerId: uuid("customer_id").notNull().references(() => customers.id),
  serviceId: uuid("service_id").notNull().references(() => services.id),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  quantity: integer("quantity").notNull().default(1),
  priceSnapshot: money("price_snapshot").notNull(),
  metadata: jsonb("metadata"),
  status: text("status").notNull().default("ACTIVE"),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  cancelReason: text("cancel_reason"),
});

export const serviceUsages = pgTable("service_usages", {
  id: id(),
  orgId: uuid("org_id").notNull(),
  branchId: uuid("branch_id").notNull(),
  customerId: uuid("customer_id").notNull().references(() => customers.id),
  serviceId: uuid("service_id").notNull().references(() => services.id),
  usedAt: timestamp("used_at", { withTimezone: true }).notNull().defaultNow(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: money("unit_price").notNull(),
  amount: money("amount").notNull(),
  recordedBy: uuid("recorded_by"),
  billedInvoiceId: uuid("billed_invoice_id"),
});
