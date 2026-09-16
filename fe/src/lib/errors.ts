import { ApiError } from "./api-client";

/** Gộp lỗi field-level (Zod/ajv) thành 1 câu dễ đọc thay vì object JSON thô. */
export function getErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.issues && typeof err.issues === "object") {
      const asAjv = err.issues as Array<{ message?: string }>;
      if (Array.isArray(asAjv) && asAjv.length > 0) {
        return asAjv.map((i) => i.message).filter(Boolean).join("; ") || err.message;
      }
    }
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return "Đã xảy ra lỗi không xác định";
}
