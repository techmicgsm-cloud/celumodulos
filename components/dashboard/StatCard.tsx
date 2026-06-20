import { type LucideIcon } from "lucide-react";
import clsx from "clsx";

export function StatCard({
  label,
  value,
  sublabel,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  sublabel?: string;
  icon: LucideIcon;
  tone?: "default" | "copper" | "green";
}) {
  const toneClasses = {
    default: "text-text-secondary bg-white/5",
    copper: "text-copper bg-copper/10",
    green: "text-signal-green bg-signal-green/10",
  }[tone];

  return (
    <div className="rounded-lg border border-white/8 bg-bg-panel p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="instrument-label text-[10px]">{label}</p>
        <div className={clsx("flex items-center justify-center w-7 h-7 rounded-md", toneClasses)}>
          <Icon size={14} strokeWidth={1.75} />
        </div>
      </div>
      <p className="text-2xl font-semibold text-text-primary tabular-nums tracking-tight">
        {value}
      </p>
      {sublabel && <p className="text-xs text-text-muted mt-1">{sublabel}</p>}
    </div>
  );
}
