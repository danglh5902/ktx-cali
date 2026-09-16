import { clearTokens, getTokens, setTokens } from "./token-store";

const API_URL = import.meta.env.VITE_API_URL;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly issues?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Ném ra khi refresh token cũng đã hết hạn — nơi gọi nên điều hướng về /login. */
export class SessionExpiredError extends Error {
  constructor() {
    super("Session expired");
    this.name = "SessionExpiredError";
  }
}

/**
 * `clearTokens()` xóa localStorage nhưng không tự cập nhật state React của
 * `AuthProvider` — nếu không có tín hiệu này, `ProtectedRoute` vẫn coi user
 * là "đã đăng nhập" (state cũ) và mọi request sau đó cứ lặp lại lỗi 401 y hệt
 * thay vì đưa người dùng về /login. AuthProvider lắng nghe sự kiện này để tự
 * logout ngay khi phiên thật sự hết hạn.
 */
const SESSION_EXPIRED_EVENT = "ktx:session-expired";

function notifySessionExpired(): void {
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}

export function onSessionExpired(handler: () => void): () => void {
  window.addEventListener(SESSION_EXPIRED_EVENT, handler);
  return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handler);
}

let refreshPromise: Promise<string> | null = null;

/** Gọi trực tiếp bằng fetch thô (không qua apiFetch) để tránh đệ quy 401 → refresh → 401 → ... */
async function performRefresh(refreshToken: string): Promise<string> {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) throw new SessionExpiredError();
  const data = (await res.json()) as { accessToken: string; refreshToken: string };
  setTokens(data);
  return data.accessToken;
}

/** Nhiều request 401 cùng lúc chỉ trigger 1 lần refresh — các request khác chờ chung promise đó. */
function refreshAccessToken(refreshToken: string): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = performRefresh(refreshToken).finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Bỏ qua đính kèm Authorization — dùng cho /auth/login. */
  skipAuth?: boolean;
}

async function rawRequest(path: string, options: ApiFetchOptions, accessToken?: string): Promise<Response> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  return fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
}

/**
 * Wrapper fetch dùng cho mọi gọi API tới be/. Tự đính kèm access token, tự
 * refresh 1 lần khi gặp 401, tự parse lỗi theo format của be/core/errors.
 */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const tokens = options.skipAuth ? null : getTokens();
  let res = await rawRequest(path, options, tokens?.accessToken);

  if (res.status === 401 && !options.skipAuth && tokens?.refreshToken) {
    try {
      const newAccessToken = await refreshAccessToken(tokens.refreshToken);
      res = await rawRequest(path, options, newAccessToken);
      // Refresh trả về "thành công" nhưng access token mới vẫn bị BE từ chối
      // (vd. refresh token cũ đã bị revoke phía Supabase) — vẫn phải coi đây
      // là phiên hết hạn thay vì để lỗi 401 thô "Invalid or expired token"
      // hiển thị mãi trên trang mà không đưa người dùng về /login.
      if (res.status === 401) throw new SessionExpiredError();
    } catch {
      clearTokens();
      notifySessionExpired();
      throw new SessionExpiredError();
    }
  }

  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json") ? await res.json() : await res.text();

  if (!res.ok) {
    const message = typeof payload === "object" && payload && "error" in payload ? String(payload.error) : res.statusText;
    const code = typeof payload === "object" && payload && "code" in payload ? String(payload.code) : undefined;
    const issues = typeof payload === "object" && payload && "issues" in payload ? payload.issues : undefined;
    throw new ApiError(message, res.status, code, issues);
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: ApiFetchOptions) =>
    apiFetch<T>(path, { ...options, method: "POST", body }),
  patch: <T>(path: string, body?: unknown) => apiFetch<T>(path, { method: "PATCH", body }),
};
