/**
 * Row-Level Security policy generator. See docs/11-architecture.md §2 D5 and
 * docs/12-database-schema.md "Row-Level Security".
 *
 * Every policy reads three session variables set per-request by
 * `core/db/request-context.ts`: `app.org_id`, `app.scope` (`'ALL' | 'BRANCH'`),
 * `app.allowed_branch_ids` (comma-separated UUIDs). Policies are generated
 * from small config objects instead of hand-written per table so every
 * business table gets the same scoping guarantee — a missed table is a
 * config omission, not a typo buried in 50 near-identical SQL blocks.
 */

type BranchColumnKind = "single" | "array" | "none";

interface TableScopeConfig {
  table: string;
  /** Column holding the organisation id. Defaults to `org_id`. */
  orgColumn?: string;
  /** Column holding the branch id (or array of branch ids), or "none" for org-only tables. */
  branchColumn?: string;
  branchColumnKind?: BranchColumnKind;
}

/**
 * Tables scoped by org (+ optionally branch). `organizations`, `users`, and
 * `user_role_assignments` are handled separately below — they need an extra
 * "read your own row" bootstrap policy so a request can discover its own
 * permissions before `app.org_id`/`app.scope` are known.
 */
export const SCOPED_TABLES: TableScopeConfig[] = [
  // Nhóm 1 — Tổ chức & Phân quyền
  { table: "branches", branchColumn: "id", branchColumnKind: "single" },
  { table: "buildings", branchColumn: "branch_id", branchColumnKind: "single" },
  { table: "floors", branchColumn: "branch_id", branchColumnKind: "single" },
  { table: "room_types", branchColumn: "branch_id", branchColumnKind: "single" },
  { table: "rooms", branchColumn: "branch_id", branchColumnKind: "single" },
  { table: "beds", branchColumn: "branch_id", branchColumnKind: "single" },
  { table: "roles", branchColumnKind: "none" },
  { table: "staff", branchColumn: "branch_ids", branchColumnKind: "array" },

  // Nhóm 2 — Khách thuê & Lưu trú
  // `customers` has no branch_id (a tenant can move between branches over
  // time) — org-wide visibility, branch-level UX filtering happens in the
  // service layer via `current_branch_id`.
  { table: "customers", branchColumnKind: "none" },
  { table: "bookings", branchColumn: "branch_id", branchColumnKind: "single" },
  { table: "contracts", branchColumn: "branch_id", branchColumnKind: "single" },
  { table: "bed_assignments", branchColumn: "branch_id", branchColumnKind: "single" },
  { table: "checkin_checkout_records", branchColumn: "branch_id", branchColumnKind: "single" },

  // Nhóm 3 — Tài chính
  { table: "billing_periods", branchColumn: "branch_id", branchColumnKind: "single" },
  { table: "invoices", branchColumn: "branch_id", branchColumnKind: "single" },
  { table: "invoice_lines", branchColumn: "branch_id", branchColumnKind: "single" },
  { table: "invoice_adjustments", branchColumn: "branch_id", branchColumnKind: "single" },
  { table: "payments", branchColumn: "branch_id", branchColumnKind: "single" },
  { table: "payment_allocations", branchColumn: "branch_id", branchColumnKind: "single" },
  { table: "deposit_ledger", branchColumn: "branch_id", branchColumnKind: "single" },
  { table: "cash_sessions", branchColumn: "branch_id", branchColumnKind: "single" },
  { table: "expenses", branchColumn: "branch_id", branchColumnKind: "single" },

  // Nhóm 4 — Điện nước & Dịch vụ
  { table: "utility_meters", branchColumn: "branch_id", branchColumnKind: "single" },
  { table: "utility_readings", branchColumn: "branch_id", branchColumnKind: "single" },
  { table: "services", branchColumn: "branch_id", branchColumnKind: "single" },
  { table: "service_subscriptions", branchColumn: "branch_id", branchColumnKind: "single" },
  { table: "service_usages", branchColumn: "branch_id", branchColumnKind: "single" },

  // Nhóm 5 — Vận hành
  { table: "maintenance_tickets", branchColumn: "branch_id", branchColumnKind: "single" },
  { table: "assets", branchColumn: "branch_id", branchColumnKind: "single" },
  { table: "housekeeping_tasks", branchColumn: "branch_id", branchColumnKind: "single" },
  { table: "house_rules", branchColumn: "branch_id", branchColumnKind: "single" },
  { table: "violations", branchColumn: "branch_id", branchColumnKind: "single" },
  { table: "visitor_logs", branchColumn: "branch_id", branchColumnKind: "single" },
  { table: "staff_shifts", branchColumn: "branch_id", branchColumnKind: "single" },

  // Nhóm 6 — Hệ thống
  { table: "notifications", branchColumn: "branch_id", branchColumnKind: "single" },
  { table: "notification_templates", branchColumnKind: "none" },
  { table: "audit_logs", branchColumn: "branch_id", branchColumnKind: "single" },
  { table: "attachments", branchColumn: "branch_id", branchColumnKind: "single" },
  { table: "report_snapshots", branchColumn: "branch_id", branchColumnKind: "single" },
];

/**
 * Child tables that only carry `branch_id` (no `org_id`) in docs/12 —
 * `ticket_events`, `asset_events`. Scoping by branch alone is safe because a
 * caller's `allowed_branch_ids` is already computed within their own org
 * (see core/auth/context-plugin.ts), so branch membership implies org
 * membership.
 */
export const BRANCH_ONLY_TABLES: string[] = ["ticket_events", "asset_events"];

/**
 * Tables intentionally left without RLS: `idempotency_keys` and `counters`
 * carry no tenant-identifying column and are only ever touched by trusted
 * repository code, never returned directly to a client.
 */
export const UNSCOPED_TABLES: string[] = ["idempotency_keys", "counters"];

/**
 * Reads a session GUC as `NULL` when unset — safe for casting to `uuid`.
 *
 * `current_setting(name, true)` returns NULL only the first time a custom
 * GUC is ever touched on a connection; once `set_config(name, val, true)`
 * (LOCAL) has run in ANY earlier transaction on that same physical
 * connection, Postgres keeps the GUC as a session-lifetime "placeholder"
 * whose value resets to `''` (empty string, NOT NULL) at the end of every
 * later transaction that doesn't set it again. Under connection pooling a
 * later request's transaction can easily be the one that "doesn't set it
 * again" (e.g. the auth-bootstrap transaction only sets `app.auth_uid`, not
 * `app.org_id`) and land on a reused connection, so `''::uuid` must be
 * guarded explicitly — otherwise it throws `invalid input syntax for type
 * uuid: ""` intermittently depending on what ran earlier on that connection.
 */
function safeUuidSetting(name: string): string {
  return `NULLIF(current_setting('${name}', true), '')::uuid`;
}

function safeUuidArraySetting(name: string): string {
  return `string_to_array(NULLIF(current_setting('${name}', true), ''), ',')::uuid[]`;
}

function orgCondition(orgColumn: string): string {
  return `${orgColumn} = ${safeUuidSetting("app.org_id")}`;
}

function branchCondition(column: string, kind: BranchColumnKind): string {
  if (kind === "none") return "true";
  if (kind === "array") {
    return `current_setting('app.scope', true) = 'ALL' OR ${column} && ${safeUuidArraySetting("app.allowed_branch_ids")}`;
  }
  // single column — NULL-safe so nullable branch_id columns (audit_logs,
  // notifications, attachments) stay visible for org-wide entries.
  return (
    `current_setting('app.scope', true) = 'ALL' OR ${column} IS NULL OR ` +
    `${column} = ANY (${safeUuidArraySetting("app.allowed_branch_ids")})`
  );
}

function policyStatements(config: TableScopeConfig): string[] {
  const orgColumn = config.orgColumn ?? "org_id";
  const branchKind = config.branchColumnKind ?? "single";
  const branchColumn = config.branchColumn ?? "branch_id";

  const using =
    branchKind === "none"
      ? orgCondition(orgColumn)
      : `${orgCondition(orgColumn)} AND (${branchCondition(branchColumn, branchKind)})`;

  const policyName = `${config.table}_org_branch_scope`;
  return [
    `ALTER TABLE ${config.table} ENABLE ROW LEVEL SECURITY;`,
    `DROP POLICY IF EXISTS ${policyName} ON ${config.table};`,
    `CREATE POLICY ${policyName} ON ${config.table} USING (${using}) WITH CHECK (${using});`,
  ];
}

function branchOnlyPolicyStatements(table: string): string[] {
  const using = branchCondition("branch_id", "single");
  const policyName = `${table}_branch_scope`;
  return [
    `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`,
    `DROP POLICY IF EXISTS ${policyName} ON ${table};`,
    `CREATE POLICY ${policyName} ON ${table} USING (${using}) WITH CHECK (${using});`,
  ];
}

/**
 * `organizations`, `users`, `user_role_assignments` need a bootstrap "read
 * your own row" policy (checked against `app.auth_uid`, set immediately
 * after JWT verification — before `app.org_id`/`app.scope` are known) OR-ed
 * with the normal org/branch policy for the rest of a request's lifetime.
 * See core/auth/context-plugin.ts.
 */
const BOOTSTRAP_STATEMENTS: string[] = [
  `ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;`,
  `DROP POLICY IF EXISTS organizations_self_scope ON organizations;`,
  `CREATE POLICY organizations_self_scope ON organizations USING (
     id = ${safeUuidSetting("app.org_id")}
   );`,

  `ALTER TABLE users ENABLE ROW LEVEL SECURITY;`,
  `DROP POLICY IF EXISTS users_self_or_org_scope ON users;`,
  `CREATE POLICY users_self_or_org_scope ON users USING (
     id = ${safeUuidSetting("app.auth_uid")}
     OR org_id = ${safeUuidSetting("app.org_id")}
   );`,

  `ALTER TABLE user_role_assignments ENABLE ROW LEVEL SECURITY;`,
  `DROP POLICY IF EXISTS user_role_assignments_self_or_org_scope ON user_role_assignments;`,
  `CREATE POLICY user_role_assignments_self_or_org_scope ON user_role_assignments USING (
     user_id = ${safeUuidSetting("app.auth_uid")}
     OR org_id = ${safeUuidSetting("app.org_id")}
   );`,
];

/**
 * Supabase tự động bật RLS mặc định trên MỌI bảng mới tạo (an toàn theo mặc
 * định ở cấp platform, không liên quan gì tới script này) — nếu không có
 * policy nào, bảng bị khóa ghi/đọc hoàn toàn kể cả với các thao tác nội bộ,
 * đáng tin cậy như `counters`/`idempotency_keys`. Phải tắt RLS tường minh
 * cho các bảng này thay vì giả định "không đụng vào = không có RLS".
 */
function unscopedTableStatements(table: string): string[] {
  return [`ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;`];
}

export function generateAllPolicySql(): string[] {
  const statements: string[] = [...BOOTSTRAP_STATEMENTS];
  for (const config of SCOPED_TABLES) statements.push(...policyStatements(config));
  for (const table of BRANCH_ONLY_TABLES) statements.push(...branchOnlyPolicyStatements(table));
  for (const table of UNSCOPED_TABLES) statements.push(...unscopedTableStatements(table));
  return statements;
}
