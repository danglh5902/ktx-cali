/**
 * Nhóm 3 — Tài chính. See docs/09-module-billing.md and docs/12-database-schema.md.
 * Bảy nguyên tắc tài chính bất di bất dịch: docs/09 §0.
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
import { branches } from "./org-permissions.js";
import { contracts, customers } from "./tenancy.js";
import { auditColumns, id, money } from "./_shared.js";

export const billingPeriods = pgTable("billing_periods", {
  id: id(),
  orgId: uuid("org_id").notNull(),
  branchId: uuid("branch_id").notNull().references(() => branches.id),
  code: text("code").notNull(),
  periodFrom: date("period_from").notNull(),
  periodTo: date("period_to").notNull(),
  issueDate: date("issue_date"),
  dueDate: date("due_date"),
  status: text("status").notNull().default("OPEN"),
  invoiceCount: integer("invoice_count").notNull().default(0),
  totalAmount: money("total_amount").notNull().default(0n),
  generatedAt: timestamp("generated_at", { withTimezone: true }),
  generatedBy: uuid("generated_by"),
  issuedAt: timestamp("issued_at", { withTimezone: true }),
  issuedBy: uuid("issued_by"),
  closedAt: timestamp("closed_at", { withTimezone: true }),
}, (t) => ({
  branchCodeUnique: uniqueIndex("billing_periods_branch_id_code_key").on(t.branchId, t.code),
}));

/** Không có `pdf_url` — hệ thống không tạo/lưu PDF, xem docs/11 §7.2. */
export const invoices = pgTable("invoices", {
  id: id(),
  orgId: uuid("org_id").notNull(),
  branchId: uuid("branch_id").notNull().references(() => branches.id),
  invoiceNo: text("invoice_no").notNull(),
  invoiceType: text("invoice_type").notNull().default("PERIODIC"),
  contractId: uuid("contract_id").notNull().references(() => contracts.id),
  customerId: uuid("customer_id").notNull().references(() => customers.id),
  billingPeriodId: uuid("billing_period_id").references(() => billingPeriods.id),
  periodFrom: date("period_from").notNull(),
  periodTo: date("period_to").notNull(),
  issueDate: date("issue_date"),
  dueDate: date("due_date"),
  subtotal: money("subtotal").notNull().default(0n),
  discountTotal: money("discount_total").notNull().default(0n),
  penaltyTotal: money("penalty_total").notNull().default(0n),
  adjustmentTotal: money("adjustment_total").notNull().default(0n),
  grandTotal: money("grand_total").notNull().default(0n),
  paidAmount: money("paid_amount").notNull().default(0n),
  balance: money("balance").notNull().default(0n),
  status: text("status").notNull().default("DRAFT"),
  snapshot: jsonb("snapshot").$type<Record<string, unknown>>(),
  issuedBy: uuid("issued_by"),
  issuedAt: timestamp("issued_at", { withTimezone: true }),
  voidedBy: uuid("voided_by"),
  voidedAt: timestamp("voided_at", { withTimezone: true }),
  voidReason: text("void_reason"),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  sentChannels: text("sent_channels").array(),
  notes: text("notes"),
  ...auditColumns,
}, (t) => ({
  invoiceNoUnique: uniqueIndex("invoices_invoice_no_key").on(t.invoiceNo),
  // Chống sinh hóa đơn trùng kỳ.
  contractBillingPeriodUnique: uniqueIndex("invoices_contract_id_billing_period_id_key").on(
    t.contractId,
    t.billingPeriodId,
  ),
}));

export const invoiceLines = pgTable("invoice_lines", {
  id: id(),
  orgId: uuid("org_id").notNull(),
  branchId: uuid("branch_id").notNull(),
  invoiceId: uuid("invoice_id").notNull().references(() => invoices.id),
  lineType: text("line_type").notNull(),
  description: text("description").notNull(),
  calculationNote: text("calculation_note"),
  quantity: text("quantity"),
  unit: text("unit"),
  unitPrice: money("unit_price"),
  amount: money("amount").notNull(),
  periodFrom: date("period_from"),
  periodTo: date("period_to"),
  sourceType: text("source_type"),
  sourceId: uuid("source_id"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const invoiceAdjustments = pgTable("invoice_adjustments", {
  id: id(),
  orgId: uuid("org_id").notNull(),
  branchId: uuid("branch_id").notNull(),
  invoiceId: uuid("invoice_id").notNull().references(() => invoices.id),
  adjustmentNo: text("adjustment_no").notNull(),
  amount: money("amount").notNull(),
  reason: text("reason").notNull(),
  evidenceUrls: text("evidence_urls").array(),
  requestedBy: uuid("requested_by").notNull(),
  requestedAt: timestamp("requested_at", { withTimezone: true }).notNull().defaultNow(),
  approvedBy: uuid("approved_by"),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  status: text("status").notNull().default("PENDING"),
  rejectReason: text("reject_reason"),
}, (t) => ({
  adjustmentNoUnique: uniqueIndex("invoice_adjustments_adjustment_no_key").on(t.adjustmentNo),
}));

/** Không có `receipt_url` — phiếu thu xem/in trực tiếp từ màn hình. */
export const payments = pgTable("payments", {
  id: id(),
  orgId: uuid("org_id").notNull(),
  branchId: uuid("branch_id").notNull().references(() => branches.id),
  paymentNo: text("payment_no").notNull(),
  customerId: uuid("customer_id").notNull().references(() => customers.id),
  payerName: text("payer_name"),
  payerAccount: text("payer_account"),
  amount: money("amount").notNull(),
  method: text("method").notNull(),
  externalTxnId: text("external_txn_id"),
  idempotencyKey: text("idempotency_key"),
  bankRef: text("bank_ref"),
  bankStatementId: text("bank_statement_id"),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  receivedBy: uuid("received_by"),
  cashSessionId: uuid("cash_session_id"),
  allocatedAmount: money("allocated_amount").notNull().default(0n),
  unallocatedAmount: money("unallocated_amount").notNull().default(0n),
  reconciledAt: timestamp("reconciled_at", { withTimezone: true }),
  reconciledBy: uuid("reconciled_by"),
  status: text("status").notNull().default("PENDING"),
  reversedBy: uuid("reversed_by"),
  reversedAt: timestamp("reversed_at", { withTimezone: true }),
  reverseReason: text("reverse_reason"),
  reversalOfPaymentId: uuid("reversal_of_payment_id"),
  note: text("note"),
}, (t) => ({
  paymentNoUnique: uniqueIndex("payments_payment_no_key").on(t.paymentNo),
  // Chống ghi nhận thanh toán trùng — cột cho phép null.
  idempotencyKeyUnique: uniqueIndex("payments_idempotency_key_key").on(t.idempotencyKey),
  externalTxnIdUnique: uniqueIndex("payments_external_txn_id_key").on(t.externalTxnId),
}));

export const paymentAllocations = pgTable("payment_allocations", {
  id: id(),
  orgId: uuid("org_id").notNull(),
  branchId: uuid("branch_id").notNull(),
  paymentId: uuid("payment_id").notNull().references(() => payments.id),
  invoiceId: uuid("invoice_id").notNull().references(() => invoices.id),
  amount: money("amount").notNull(),
  allocatedBy: uuid("allocated_by"),
  allocatedAt: timestamp("allocated_at", { withTimezone: true }).notNull().defaultNow(),
  isAutomatic: boolean("is_automatic").notNull().default(true),
  reversedAt: timestamp("reversed_at", { withTimezone: true }),
  reversedBy: uuid("reversed_by"),
});

export const depositLedger = pgTable("deposit_ledger", {
  id: id(),
  orgId: uuid("org_id").notNull(),
  branchId: uuid("branch_id").notNull(),
  contractId: uuid("contract_id").notNull().references(() => contracts.id),
  customerId: uuid("customer_id").notNull().references(() => customers.id),
  entryNo: text("entry_no").notNull(),
  entryType: text("entry_type").notNull(),
  amount: money("amount").notNull(),
  balanceAfter: money("balance_after").notNull(),
  reason: text("reason"),
  relatedInvoiceId: uuid("related_invoice_id"),
  relatedPaymentId: uuid("related_payment_id"),
  relatedTicketId: uuid("related_ticket_id"),
  requestedBy: uuid("requested_by"),
  approvedBy: uuid("approved_by"),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  executedBy: uuid("executed_by"),
  executedAt: timestamp("executed_at", { withTimezone: true }),
  status: text("status").notNull().default("PENDING"),
  refundMethod: text("refund_method"),
  refundDueDate: date("refund_due_date"),
  evidenceUrls: text("evidence_urls").array(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  entryNoUnique: uniqueIndex("deposit_ledger_entry_no_key").on(t.entryNo),
}));

export const cashSessions = pgTable("cash_sessions", {
  id: id(),
  orgId: uuid("org_id").notNull(),
  branchId: uuid("branch_id").notNull().references(() => branches.id),
  sessionNo: text("session_no").notNull(),
  staffId: uuid("staff_id").notNull(),
  shiftId: uuid("shift_id"),
  openedAt: timestamp("opened_at", { withTimezone: true }).notNull().defaultNow(),
  openingBalance: money("opening_balance").notNull().default(0n),
  closedAt: timestamp("closed_at", { withTimezone: true }),
  systemTotal: money("system_total"),
  countedTotal: money("counted_total"),
  variance: money("variance"),
  varianceReason: text("variance_reason"),
  handoverNote: text("handover_note"),
  status: text("status").notNull().default("OPEN"),
  reviewedBy: uuid("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  depositedToBank: boolean("deposited_to_bank").notNull().default(false),
  bankDepositRef: text("bank_deposit_ref"),
  depositedAt: timestamp("deposited_at", { withTimezone: true }),
}, (t) => ({
  sessionNoUnique: uniqueIndex("cash_sessions_session_no_key").on(t.sessionNo),
}));

export const expenses = pgTable("expenses", {
  id: id(),
  orgId: uuid("org_id").notNull(),
  branchId: uuid("branch_id").notNull().references(() => branches.id),
  buildingId: uuid("building_id"),
  expenseNo: text("expense_no").notNull(),
  category: text("category").notNull(),
  amount: money("amount").notNull(),
  expenseDate: date("expense_date").notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  vendor: text("vendor"),
  vendorInvoiceRef: text("vendor_invoice_ref"),
  paymentMethod: text("payment_method"),
  description: text("description"),
  attachments: text("attachments").array(),
  isRecurring: boolean("is_recurring").notNull().default(false),
  recurringConfig: jsonb("recurring_config"),
  relatedTicketId: uuid("related_ticket_id"),
  relatedAssetId: uuid("related_asset_id"),
  allocationRule: jsonb("allocation_rule"),
  status: text("status").notNull().default("DRAFT"),
  createdBy: uuid("created_by"),
  approvedBy: uuid("approved_by"),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
}, (t) => ({
  expenseNoUnique: uniqueIndex("expenses_expense_no_key").on(t.expenseNo),
}));

export const idempotencyKeys = pgTable("idempotency_keys", {
  key: text("key").primaryKey(),
  scope: text("scope"),
  requestHash: text("request_hash"),
  responseBody: jsonb("response_body"),
  statusCode: integer("status_code"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
