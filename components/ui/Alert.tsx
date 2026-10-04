import type { ReactNode } from "react";

export default function Alert({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: "info" | "success" | "warning" | "danger";
}) {
  const classes = {
    info: "border-bamboo/20 bg-bamboo/8 text-bamboo",
    success: "border-green-200 bg-green-50 text-green-800",
    warning: "border-gold/30 bg-gold/10 text-[#7a5a06]",
    danger: "border-lacquer/20 bg-lacquer/8 text-lacquer",
  }[tone];
  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-sm font-medium ${classes}`}
    >
      {children}
    </div>
  );
}

export function LoadingBlock({ label = "Đang tải..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-muted">
      <span className="size-5 animate-spin rounded-full border-2 border-lacquer/20 border-t-lacquer" />
      {label}
    </div>
  );
}
