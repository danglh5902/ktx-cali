import { useEffect } from "react";
import { X } from "lucide-react";
import { clsx } from "clsx";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** "md" (mặc định, form tạo/sửa) hoặc "lg" (trang chi tiết nhiều mục). */
  size?: "md" | "lg";
}

const SIZE_CLASSES = { md: "max-w-lg", lg: "max-w-3xl" };

/**
 * Modal tối giản (không phụ thuộc Radix/shadcn) — đủ cho form tạo/sửa.
 * Đóng bằng Esc hoặc bấm ra ngoài, theo docs/15 §10 "thao tác được hoàn
 * toàn bằng bàn phím".
 */
export function Dialog({ open, onClose, title, children, size = "md" }: DialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-16">
      <button
        aria-label="Đóng"
        className="fixed inset-0 cursor-default"
        onClick={onClose}
        tabIndex={-1}
      />
      <div className={clsx("relative w-full rounded-lg bg-white shadow-xl", SIZE_CLASSES[size])}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
