import { createRemoteJWKSet, decodeProtectedHeader, jwtVerify } from "jose";
import { env } from "../../env.js";

export interface SupabaseJwtPayload {
  sub: string;
  email?: string;
  phone?: string;
  role?: string;
}

const legacySecret = new TextEncoder().encode(env.SUPABASE_JWT_SECRET);

/**
 * Supabase projects created/migrated to the newer "JWT signing keys" feature
 * issue access tokens signed with an asymmetric algorithm (ES256 as of this
 * writing) and publish the public key via JWKS — the shared `SUPABASE_JWT_SECRET`
 * (HS256) is only valid for the legacy symmetric signing method. Verifying
 * ES256 tokens against the HS256 secret always fails, which — before this
 * fix — silently rejected every real login with a generic 401 (self-signed
 * HS256 test tokens never caught this because they matched the hardcoded
 * algorithm by construction). `createRemoteJWKSet` caches keys and refetches
 * on `kid` misses, so key rotation on Supabase's side needs no code change.
 */
const jwks = createRemoteJWKSet(new URL(`${env.supabaseAuthUrl}/.well-known/jwks.json`));

/**
 * Verifies a Supabase Auth access token — asymmetric (JWKS) for current
 * projects, falling back to the legacy HS256 project secret for older ones.
 * Throws if the token is missing, expired, or signed with neither.
 */
export async function verifySupabaseJwt(token: string): Promise<SupabaseJwtPayload> {
  const { alg } = decodeProtectedHeader(token);

  const { payload } =
    alg === "HS256"
      ? await jwtVerify(token, legacySecret, { algorithms: ["HS256"] })
      : await jwtVerify(token, jwks);

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
