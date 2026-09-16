import { jwtVerify } from "jose";
import { env } from "../../env.js";

export interface SupabaseJwtPayload {
  sub: string;
  email?: string;
  phone?: string;
  role?: string;
}

const secret = new TextEncoder().encode(env.SUPABASE_JWT_SECRET);

/**
 * Verifies a Supabase Auth access token (HS256, project JWT secret from
 * Supabase → Project Settings → API). Throws if the token is missing,
 * expired, or signed with the wrong secret.
 */
export async function verifySupabaseJwt(token: string): Promise<SupabaseJwtPayload> {
  const { payload } = await jwtVerify(token, secret, {
    algorithms: ["HS256"],
  });

  if (typeof payload.sub !== "string") {
    throw new Error("JWT payload missing sub claim");
  }

  return {
    sub: payload.sub,
    email: typeof payload.email === "string" ? payload.email : undefined,
    phone: typeof payload.phone === "string" ? payload.phone : undefined,
    role: typeof payload.role === "string" ? payload.role : undefined,
  };
}
