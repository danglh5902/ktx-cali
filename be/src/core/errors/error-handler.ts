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

  request.log.error({ err: error }, "Unhandled error");
  reply.code(500).send({ error: "Internal server error", code: "INTERNAL_ERROR" });
}
