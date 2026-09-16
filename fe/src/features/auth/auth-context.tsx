import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, onSessionExpired } from "../../lib/api-client";
import { clearTokens, getTokens, setTokens } from "../../lib/token-store";

interface AuthUser {
  id: string;
  email: string | null;
}

interface SessionResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  user: AuthUser;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const CURRENT_USER_KEY = "ktx.currentUser";

function loadStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(CURRENT_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => (getTokens() ? loadStoredUser() : null));

  const login = useCallback(async (email: string, password: string) => {
    const session = await api.post<SessionResponse>("/auth/login", { email, password }, { skipAuth: true });
    setTokens(session);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(session.user));
    setUser(session.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Đăng xuất vẫn nên xóa phiên cục bộ dù be/ không phản hồi được —
      // không để người dùng bị kẹt lại màn hình đã đăng nhập.
    } finally {
      clearTokens();
      localStorage.removeItem(CURRENT_USER_KEY);
      setUser(null);
    }
  }, []);

  // Phiên hết hạn giữa chừng (access + refresh token đều không dùng được
  // nữa) — api-client đã tự xóa token khỏi localStorage, ở đây chỉ cần đồng
  // bộ lại state React để `ProtectedRoute` (đọc `isAuthenticated` từ đây,
  // không đọc thẳng localStorage) nhận ra và điều hướng về /login ngay,
  // thay vì tiếp tục hiển thị lỗi 401 thô trên trang đang xem.
  useEffect(() => {
    return onSessionExpired(() => {
      localStorage.removeItem(CURRENT_USER_KEY);
      setUser(null);
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: user !== null, login, logout }),
    [user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
