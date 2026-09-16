import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import sensible from "@fastify/sensible";
import Fastify, { type FastifyInstance } from "fastify";
import { env } from "./env.js";
import { registerAuthContext } from "./core/auth/context-plugin.js";
import { errorHandler } from "./core/errors/error-handler.js";
import { registerSwagger, registerSwaggerUi } from "./core/swagger/plugin.js";
import { registerAuthRoutes } from "./modules/auth/auth.routes.js";
import { registerBranchRoutes } from "./modules/branches/branch.routes.js";
import { registerBuildingRoutes } from "./modules/buildings/building.routes.js";
import { registerFloorRoutes } from "./modules/floors/floor.routes.js";
import { registerRoomTypeRoutes } from "./modules/room-types/room-type.routes.js";
import { registerRoomRoutes } from "./modules/rooms/room.routes.js";
import { registerBedRoutes } from "./modules/beds/bed.routes.js";

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport: env.NODE_ENV === "development" ? { target: "pino-pretty" } : undefined,
    },
  });

  app.register(helmet, {
    // Swagger UI's inline styles/scripts need a relaxed CSP; safe to loosen
    // only in development, keep default (strict) helmet CSP in production.
    contentSecurityPolicy: env.NODE_ENV === "development" ? false : undefined,
  });
  app.register(cors, { origin: true, credentials: true });
  app.register(sensible);

  app.setErrorHandler(errorHandler);

  // @fastify/swagger registers an `onRoute` hook to collect each route's
  // `schema` — but `.register()` defers the plugin's own setup to Fastify's
  // boot queue (avvio), it does NOT run synchronously. Routes added via a
  // plain `app.get(...)` call right after `.register(swagger, ...)` would
  // still run BEFORE that hook attaches and be silently missing from the
  // generated OpenAPI doc. To guarantee correct boot order, every route is
  // added inside its own `app.register(async (instance) => ...)` below,
  // so avvio boots it strictly after swagger/swagger-ui.
  registerSwagger(app);
  registerSwaggerUi(app);

  // Hooks/decorators (unlike plugin bodies) apply immediately and are
  // inherited by any child context created afterwards, so this can stay a
  // direct call — see context-plugin.ts.
  registerAuthContext(app);

  app.register(async (instance) => {
    instance.get("/health", { config: { public: true } }, async () => ({ status: "ok" }));
    registerAuthRoutes(instance);
    registerBranchRoutes(instance);
    registerBuildingRoutes(instance);
    registerFloorRoutes(instance);
    registerRoomTypeRoutes(instance);
    registerRoomRoutes(instance);
    registerBedRoutes(instance);
  });

  return app;
}
