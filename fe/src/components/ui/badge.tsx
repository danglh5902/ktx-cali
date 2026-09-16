import { clsx } from "clsx";

type Tone = "green" | "amber" | "red" | "slate" | "blue" | "purple" | "cyan";

const TONE_CLASSES: Record<Tone, string> = {
  green: "bg-green-100 text-green-800",
  amber: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-800",
  slate: "bg-slate-200 text-slate-700",
  blue: "bg-blue-100 text-blue-800",
  purple: "bg-purple-100 text-purple-800",
  cyan: "bg-cyan-100 text-cyan-800",
};

/**
 * Badge trạng thái — LUÔN có chữ, không bao giờ chỉ dùng màu để truyền đạt
 * trạng thái. Xem docs/15-ux-navigation.md §5, §9, §10.
 */
export function Badge({ tone = "slate", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span className={clsx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", TONE_CLASSES[tone])}>
      {children}
    </span>
  );
}
