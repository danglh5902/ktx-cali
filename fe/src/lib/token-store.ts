/**
 * Lưu access/refresh token ở localStorage — đơn giản cho giai đoạn đầu.
 * TODO: khi có nhiều tab/thiết bị và yêu cầu bảo mật cao hơn, cân nhắc
 * chuyển access token vào memory + refresh token vào httpOnly cookie do BE
 * set (be/ hiện trả token trong JSON body theo docs/11 §11 chưa làm việc
 * này) — xem docs/11-architecture.md §7.1.
 */

const ACCESS_TOKEN_KEY = "ktx.accessToken";
const REFRESH_TOKEN_KEY = "ktx.refreshToken";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export function getTokens(): TokenPair | null {
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

export function setTokens(tokens: TokenPair): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}
