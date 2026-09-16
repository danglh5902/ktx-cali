import { Loader2 } from "lucide-react";
import { clsx } from "clsx";

/** Icon xoay dùng chung cho mọi trạng thái đang tải — không bao giờ chỉ hiện chữ suông. */
export function Spinner({ size = 16, className }: { size?: number; className?: string }) {
  return <Loader2 size={size} className={clsx("animate-spin", className)} aria-hidden="true" />;
}

/** Khối "đang tải" đứng một mình thay cho đoạn text-only cũ — dùng khi chờ danh sách/bảng. */
export function LoadingState({ label = "Đang tải..." }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
      <Spinner />
      <span>{label}</span>
    </div>
  );
}
