import type { FastifyInstance, FastifyRequest } from "fastify";
import type { RequestContext } from "../../shared/index.js";
import { verifySupabaseJwt } from "./supabase-jwt.js";
import { loadRequestContext, UserNotProvisionedError } from "./load-request-context.js";

declare module "fastify" {
  interface FastifyRequest {
    ctx: RequestContext;
  }
  interface FastifyContextConfig {
    /** Routes that don't require a signed-in user, e.g. GET /health. */
    public?: boolean;
  }
}

/**
 * Registers the auth context middleware described in
 * docs/11-architecture.md §3.3 ("Luồng xử lý một request"):
 *   Auth middleware → Context middleware → (permission guard runs per-route)
 *
 * Not wrapped with fastify-plugin on purpose — it must run in the *root*
 * encapsulation context so `request.ctx` is available to every route.
 */
export function registerAuthContext(app: FastifyInstance): void {
  app.decorateRequest("ctx", null as unknown as RequestContext);

  app.addHook("onRequest", async (request: FastifyRequest, reply) => {
    // @fastify/swagger-ui registers its own routes — no route.config to mark
    // public on those, so bypass by prefix instead. Viewing docs needs no
    // auth; calling an endpoint via "Try it out" still needs a real bearer
    // token pasted into the Authorize button.
    if (request.url.startsWith("/documentation")) return;
    if (request.routeOptions.config?.public) return;

    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return reply.code(401).send({ error: "Missing bearer token" });
    }

    const token = authHeader.slice("Bearer ".length);

    try {
      const { sub } = await verifySupabaseJwt(token);
      request.ctx = await loadRequestContext(sub);
    } catch (err) {
      if (err instanceof UserNotProvisionedError) {
        return reply.code(403).send({ error: "Account not provisioned" });
      }
      request.log.warn({ err }, "JWT verification failed");
      return reply.code(401).send({ error: "Invalid or expired token" });
    }
  });
}
