import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { AppError } from "./app-error.js";

export function errorHandler(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  if (error instanceof AppError) {
    reply.code(error.statusCode).send({ error: error.message, code: error.code });
    return;
  }

  if (error instanceof ZodError) {
    reply.code(400).send({
      error: "Validation failed",
      code: "VALIDATION_ERROR",
      issues: error.flatten(),
    });
    return;
  }

  // Fastify's own ajv validation (triggered by the JSON Schema every route
  // attaches via `schema.body`/`params`/`querystring` for Swagger docs — see
  // core/swagger/zod-schema.ts) rejects malformed requests BEFORE the
  // controller's `zodSchema.parse()` ever runs, so it never surfaces as a
  // ZodError. Fastify marks these with a `validation` array + statusCode
  // 400; without this branch they fell through to the generic 500 below.
  const fastifyError = error as FastifyError;
  if (fastifyError.validation) {
    reply.code(fastifyError.statusCode ?? 400).send({
      error: "Validation failed",
      code: "VALIDATION_ERROR",
      issues: fastifyError.validation,
    });
    return;
  }

  request.log.error({ err: error }, "Unhandled error");
  reply.code(500).send({ error: "Internal server error", code: "INTERNAL_ERROR" });
}
