/**
 * Nhóm 6 — Hệ thống. See docs/12-database-schema.md.
 */
import { sql } from "drizzle-orm";
import {
  bigint,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { id } from "./_shared.js";

export const notifications = pgTable("notifications", {
  id: id(),
  orgId: uuid("org_id").notNull(),
  branchId: uuid("branch_id"),
  recipientType: text("recipient_type").notNull(),
  recipientId: uuid("recipient_id").notNull(),
  templateCode: text("template_code"),
  title: text("title"),
  body: text("body"),
  data: jsonb("data"),
  channels: text("channels").array().notNull().default([]),
  channelStatus: jsonb("channel_status"),
  priority: text("priority").notNull().default("NORMAL"),
  relatedEntity: text("related_entity"),
  relatedEntityId: uuid("related_entity_id"),
  status: text("status").notNull().default("PENDING"),
  readAt: timestamp("read_at", { withTimezone: true }),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  retryCount: text("retry_count"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notificationTemplates = pgTable("notification_templates", {
  id: id(),
  orgId: uuid("org_id").notNull(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  channels: text("channels").array().notNull().default([]),
  subject: text("subject"),
  bodyTemplate: text("body_template").notNull(),
  zaloTemplateId: text("zalo_template_id"),
  variables: text("variables").array(),
  version: text("version"),
  status: text("status").notNull().default("ACTIVE"),
}, (t) => ({
  orgCodeUnique: uniqueIndex("notification_templates_org_id_code_key").on(t.orgId, t.code),
}));

/** Append-only — no update/delete route is ever wired to this table. */
export const auditLogs = pgTable("audit_logs", {
  id: id(),
  orgId: uuid("org_id").notNull(),
  branchId: uuid("branch_id"),
  actorId: uuid("actor_id"),
  actorName: text("actor_name"),
  actorRole: text("actor_role"),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: uuid("entity_id"),
  before: jsonb("before"),
  after: jsonb("after"),
  diff: jsonb("diff").$type<unknown[]>(),
  reason: text("reason"),
  ip: text("ip"),
  userAgent: text("user_agent"),
  requestId: text("request_id"),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
});

export const attachments = pgTable("attachments", {
  id: id(),
  orgId: uuid("org_id").notNull(),
  branchId: uuid("branch_id"),
  ownerType: text("owner_type").notNull(),
  ownerId: uuid("owner_id").notNull(),
  fileName: text("file_name"),
  mimeType: text("mime_type"),
  sizeBytes: bigint("size_bytes", { mode: "number" }),
  cloudinaryPublicId: text("cloudinary_public_id").notNull(),
  isSensitive: text("is_sensitive"),
  uploadedBy: uuid("uploaded_by"),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const counters = pgTable("counters", {
  key: text("key").primaryKey(),
  seq: bigint("seq", { mode: "bigint" }).notNull().default(sql`0`),
});

export const reportSnapshots = pgTable("report_snapshots", {
  id: id(),
  orgId: uuid("org_id").notNull(),
  branchId: uuid("branch_id").notNull(),
  date: text("date").notNull(),
  metricType: text("metric_type").notNull(),
  values: jsonb("values"),
  computedAt: timestamp("computed_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  branchMetricDateUnique: uniqueIndex("report_snapshots_branch_id_metric_type_date_key").on(
    t.branchId,
    t.metricType,
    t.date,
  ),
}));
