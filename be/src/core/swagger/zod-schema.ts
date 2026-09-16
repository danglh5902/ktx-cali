import type { ZodTypeAny } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

/**
 * Converts an existing Zod schema (the same one used for real validation in
 * the controller via `.parse()`) into a JSON Schema for Fastify route
 * `schema` — so Swagger docs stay generated from the single source of
 * truth instead of hand-duplicated. Fastify/ajv does not re-validate against
 * this; it's attached purely for documentation (see branch.routes.ts).
 */
export function zodSchema(schema: ZodTypeAny): Record<string, unknown> {
  return zodToJsonSchema(schema, { target: "openApi3", $refStrategy: "none" }) as Record<
    string,
    unknown
  >;
}

export const idParamSchema = {
  type: "object",
  properties: { id: { type: "string", format: "uuid" } },
  required: ["id"],
};
