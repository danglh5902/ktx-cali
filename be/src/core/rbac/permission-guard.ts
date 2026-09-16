import type { FastifyReply, FastifyRequest } from "fastify";
import type { Permission } from "../../shared/index.js";

// Deliberately NOT typed as Fastify's `preHandlerHookHandler` — that union
// type's direct call signature forces a 3-arg (err-first callback) shape,
// which makes these awkward to unit-test. Fastify accepts a plain 2-arg
// async preHandler structurally when it's assigned into route options.
type PreHandler = (request: FastifyRequest, reply: FastifyReply) => Promise<void>;

/**
 * Layer 1 (PERMISSION) of the 3-layer model in
 * docs/04-roles-permissions.md §1.1. Layer 2 (SCOPE) is enforced by Postgres
 * RLS once the repository call runs inside `withRequestContext()`; layer 3
 * (CONDITION — approval limits, ownership) is checked ad hoc in each
 * service, since it's business-rule-specific.
 *
 * Usage:
 *   app.post("/branches", { preHandler: requirePermission("branch:create") }, handler)
 */
export function requirePermission(permission: Permission): PreHandler {
  return async (request, reply) => {
    if (!request.ctx?.permissions.has(permission)) {
      await reply.code(403).send({ error: `Missing permission: ${permission}` });
    }
  };
}

/**
 * For routes where `scope: 'ALL'` is required regardless of permission
 * (e.g. cross-branch aggregate reports) — see docs/04 §3 R7.
 */
export function requireAllScope(): PreHandler {
  return async (request, reply) => {
    if (request.ctx?.scope !== "ALL") {
      await reply.code(403).send({ error: "This endpoint requires organization-wide scope" });
    }
  };
}
