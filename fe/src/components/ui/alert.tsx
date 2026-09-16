import { AlertTriangle } from "lucide-react";

/**
 * Thông báo lỗi phải nói rõ phải làm gì, không chỉ "Đã xảy ra lỗi" —
 * docs/15-ux-navigation.md §9.
 */
export function Alert({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
      <AlertTriangle size={16} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
