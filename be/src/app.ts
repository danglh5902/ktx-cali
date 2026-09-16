import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import sensible from "@fastify/sensible";
import Fastify, { type FastifyInstance } from "fastify";
import { env } from "./env.js";
import { registerAuthContext } from "./core/auth/context-plugin.js";
import { errorHandler } from "./core/errors/error-handler.js";
import { registerBranchRoutes } from "./modules/branches/branch.routes.js";

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport: env.NODE_ENV === "development" ? { target: "pino-pretty" } : undefined,
    },
  });

  app.register(helmet);
  app.register(cors, { origin: true, credentials: true });
  app.register(sensible);

  app.setErrorHandler(errorHandler);

  app.get("/health", { config: { public: true } }, async () => ({ status: "ok" }));

  // Auth/context middleware must be registered in the root context (not
  // inside app.register(async fn) encapsulation) — see context-plugin.ts.
  registerAuthContext(app);

  registerBranchRoutes(app);

  return app;
}
