import { forwardRef, type InputHTMLAttributes } from "react";
import { clsx } from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, error, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={clsx(
        "w-full rounded-md border px-3 py-2 text-sm text-slate-900 shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600",
        error ? "border-red-400" : "border-slate-300",
        className,
      )}
      {...props}
    />
  );
});

export function FormField({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}
