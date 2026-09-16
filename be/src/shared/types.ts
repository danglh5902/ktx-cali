import type { Permission } from "./permissions.js";

/**
 * Scope layer of the 3-layer permission model (docs/04-roles-permissions.md §1.1):
 * PERMISSION (this + `permissions`), SCOPE (this type + `allowedBranchIds`),
 * CONDITION (checked ad hoc in each service, e.g. approval limits).
 */
export type AccessScope = "ALL" | "BRANCH";

/**
 * Everything a request needs to know about "who is calling and what can they touch".
 * Built once per request by core/auth/context-plugin.ts, then passed to every
 * repository call via core/db/request-context.ts so RLS session variables and
 * the application-level permission guard stay in sync.
 */
export interface RequestContext {
  userId: string;
  orgId: string;
  staffId: string | null;
  customerId: string | null;
  permissions: ReadonlySet<Permission>;
  scope: AccessScope;
  allowedBranchIds: string[];
}

export type BranchStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";
export type GenderPolicy = "MALE" | "FEMALE" | "MIXED";
