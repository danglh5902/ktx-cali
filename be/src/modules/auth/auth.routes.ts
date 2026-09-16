import type { FastifyInstance } from "fastify";
import { loginSchema, refreshSchema } from "../../shared/index.js";
import { zodSchema } from "../../core/swagger/zod-schema.js";
import { authController } from "./auth.controller.js";

const sessionResponseExample = {
  type: "object",
  properties: {
    accessToken: { type: "string" },
    refreshToken: { type: "string" },
    expiresIn: { type: "number" },
    tokenType: { type: "string" },
    user: {
      type: "object",
      properties: { id: { type: "string", format: "uuid" }, email: { type: "string", nullable: true } },
    },
  },
};

/**
 * `config: { public: true }` — these ARE the login step, so they must run
 * before any bearer token exists. See core/auth/context-plugin.ts.
 */
export function registerAuthRoutes(app: FastifyInstance): void {
  app.post(
    "/auth/login",
    {
      config: { public: true },
      schema: {
        tags: ["auth"],
        summary: "Đăng nhập bằng email + mật khẩu",
        description:
          "Proxy tới Supabase Auth — FE chỉ cần gọi endpoint này, không cần biết Supabase. Trả về accessToken (dùng cho header Authorization: Bearer) + refreshToken.",
        body: zodSchema(loginSchema),
        response: { 200: sessionResponseExample },
      },
    },
    authController.login,
  );

  app.post(
    "/auth/refresh",
    {
      config: { public: true },
      schema: {
        tags: ["auth"],
        summary: "Lấy accessToken mới bằng refreshToken",
        description: "Gọi khi accessToken hết hạn (mặc định 1 giờ) — không bắt người dùng đăng nhập lại.",
        body: zodSchema(refreshSchema),
        response: { 200: sessionResponseExample },
      },
    },
    authController.refresh,
  );

  app.post(
    "/auth/logout",
    {
      config: { public: true },
      schema: {
        tags: ["auth"],
        summary: "Đăng xuất — thu hồi refreshToken hiện tại",
        description: "Gửi accessToken hiện tại qua header Authorization: Bearer. Không cần body.",
        security: [{ bearerAuth: [] }],
      },
    },
    authController.logout,
  );
}
