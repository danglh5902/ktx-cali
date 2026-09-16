import type { FastifyReply, FastifyRequest } from "fastify";
import { loginSchema, refreshSchema, type SessionResponse } from "../../shared/index.js";
import {
  refreshSession,
  signInWithPassword,
  signOut,
  type SupabaseSession,
} from "../../core/auth/supabase-auth-client.js";
import { AppError } from "../../core/errors/app-error.js";

// No repository/service layer here on purpose — there is no local `sessions`
// table to query; Supabase Auth (GoTrue) owns session state entirely, and
// this module is a thin, documented proxy in front of it. See
// core/auth/supabase-auth-client.ts.

function toDto(session: SupabaseSession): SessionResponse {
  return {
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    expiresIn: session.expiresIn,
    tokenType: session.tokenType,
    user: session.user,
  };
}

export const authController = {
  async login(request: FastifyRequest, reply: FastifyReply) {
    const { email, password } = loginSchema.parse(request.body);
    const session = await signInWithPassword(email, password);
    reply.code(200);
    return toDto(session);
  },

  async refresh(request: FastifyRequest, reply: FastifyReply) {
    const { refreshToken } = refreshSchema.parse(request.body);
    const session = await refreshSession(refreshToken);
    reply.code(200);
    return toDto(session);
  },

  async logout(request: FastifyRequest, reply: FastifyReply) {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new AppError("Missing bearer token", 401, "UNAUTHORIZED");
    }
    await signOut(authHeader.slice("Bearer ".length));
    return reply.code(204).send();
  },
};
