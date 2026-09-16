import { forwardRef, type ButtonHTMLAttributes } from "react";
import { clsx } from "clsx";
import { Spinner } from "./spinner";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600",
  secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50",
  danger: "bg-red-600 text-white hover:bg-red-700",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  /** Hiện icon xoay + tự disable — dùng khi nút đang submit/mutate, không chỉ đổi chữ suông. */
  loading?: boolean;
}

/**
 * Nút to, tương phản cao — docs/15-ux-navigation.md §1 "Chữ to, nút to,
 * tương phản cao" (quầy lễ tân thường có ánh sáng mạnh, màn hình nhỏ).
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", disabled, loading, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-50",
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    >
      {loading && <Spinner size={14} />}
      {children}
    </button>
  );
});
