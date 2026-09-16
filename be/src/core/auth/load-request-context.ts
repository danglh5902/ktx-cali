import { sql } from "drizzle-orm";
import { isPermission, type Permission, type RequestContext } from "../../shared/index.js";
import { db } from "../db/client.js";
import { withTransientRetry } from "../db/transient-retry.js";

export class UserNotProvisionedError extends Error {
  constructor(authUid: string) {
    super(`No active users row for Supabase auth id ${authUid}`);
    this.name = "UserNotProvisionedError";
  }
}

interface UserRow {
  id: string;
  org_id: string;
  staff_id: string | null;
  customer_id: string | null;
  status: string;
}

interface AssignmentRow {
  scope: "ALL" | "BRANCH";
  branch_ids: string[] | null;
  permissions: string[] | null;
}

/**
 * Bootstraps a `RequestContext` for the authenticated Supabase user: verifies
 * the `users` row exists and is active, then aggregates every non-revoked,
 * currently-valid `user_role_assignments` row into one permission set and
 * branch scope.
 *
 * Runs in its own short transaction using the `users_self_or_org_scope` /
 * `user_role_assignments_self_or_org_scope` bootstrap RLS policies (matched
 * via `app.auth_uid`, not `app.org_id` — which isn't known yet). See
 * core/db/rls/policies.ts.
 */
export async function loadRequestContext(authUid: string): Promise<RequestContext> {
  return withTransientRetry(() => db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.auth_uid', ${authUid}, true)`);

    const userRows = (await tx.execute(
      sql`SELECT id, org_id, staff_id, customer_id, status FROM users WHERE id = ${authUid} LIMIT 1`,
    )) as unknown as UserRow[];

    const user = userRows[0];
    if (!user || user.status !== "ACTIVE") {
      throw new UserNotProvisionedError(authUid);
    }

    // Now that org_id is known, the normal org-scoped policy also applies
    // for the rest of this bootstrap transaction.
    await tx.execute(sql`SELECT set_config('app.org_id', ${user.org_id}, true)`);

    const assignmentRows = (await tx.execute(sql`
      SELECT ura.scope, ura.branch_ids, r.permissions
      FROM user_role_assignments ura
      JOIN roles r ON r.id = ura.role_id
      WHERE ura.user_id = ${authUid}
        AND ura.revoked_at IS NULL
        AND ura.valid_from <= now()
        AND (ura.valid_until IS NULL OR ura.valid_until > now())
    `)) as unknown as AssignmentRow[];

    let scope: "ALL" | "BRANCH" = "BRANCH";
    const branchIds = new Set<string>();
    const permissions = new Set<Permission>();

    for (const row of assignmentRows) {
      if (row.scope === "ALL") scope = "ALL";
      for (const branchId of row.branch_ids ?? []) branchIds.add(branchId);
      for (const permission of row.permissions ?? []) {
        if (isPermission(permission)) permissions.add(permission);
      }
    }

    return {
      userId: user.id,
      orgId: user.org_id,
      staffId: user.staff_id,
      customerId: user.customer_id,
      permissions,
      scope,
      allowedBranchIds: Array.from(branchIds),
    } satisfies RequestContext;
  }));
}
