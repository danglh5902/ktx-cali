import { env } from "../../env.js";
import { AppError } from "../errors/app-error.js";

/**
 * Thin wrapper over Supabase Auth's REST API (GoTrue) — used by
 * modules/auth so the frontend only ever talks to OUR backend, never
 * Supabase directly. See docs/11-architecture.md §7.1.
 */

export interface SupabaseSession {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  user: { id: string; email: string | null };
}

export class InvalidCredentialsError extends AppError {
  constructor() {
    // Same message regardless of "wrong password" vs "no such user" — see
    // docs/11 §7.3: "không tiết lộ email không tồn tại".
    super("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }
}

interface GoTrueTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: { id: string; email: string | null };
}

async function callGoTrue(path: string, body: Record<string, unknown>): Promise<GoTrueTokenResponse> {
  const res = await fetch(`${env.supabaseAuthUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: env.SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    if (res.status === 400 || res.status === 401) throw new InvalidCredentialsError();
    const text = await res.text().catch(() => "");
    throw new AppError(`Supabase Auth error (${res.status}): ${text}`, 502, "AUTH_UPSTREAM_ERROR");
  }

  return (await res.json()) as GoTrueTokenResponse;
}

function toSession(res: GoTrueTokenResponse): SupabaseSession {
  return {
    accessToken: res.access_token,
    refreshToken: res.refresh_token,
    expiresIn: res.expires_in,
    tokenType: res.token_type,
    user: { id: res.user.id, email: res.user.email },
  };
}

export async function signInWithPassword(email: string, password: string): Promise<SupabaseSession> {
  const res = await callGoTrue("/token?grant_type=password", { email, password });
  return toSession(res);
}

export async function refreshSession(refreshToken: string): Promise<SupabaseSession> {
  const res = await callGoTrue("/token?grant_type=refresh_token", { refresh_token: refreshToken });
  return toSession(res);
}

/** Revokes the refresh token tied to this access token (server-side logout). */
export async function signOut(accessToken: string): Promise<void> {
  const res = await fetch(`${env.supabaseAuthUrl}/logout`, {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  // 401 here just means the token was already invalid/expired — logout is
  // idempotent from the caller's point of view either way.
  if (!res.ok && res.status !== 401) {
    const text = await res.text().catch(() => "");
    throw new AppError(`Supabase Auth error (${res.status}): ${text}`, 502, "AUTH_UPSTREAM_ERROR");
  }
}
