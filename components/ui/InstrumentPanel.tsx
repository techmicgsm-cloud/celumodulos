import clsx from "clsx";

export function InstrumentPanel({
  label,
  value,
  unit,
  sublabel,
  size = "lg",
  className,
}: {
  label: string;
  value: string;
  unit?: string;
  sublabel?: string;
  size?: "lg" | "md";
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "instrument-panel bg-pcb-grid rounded-lg px-5 py-4",
        className
      )}
    >
      <p className="instrument-label text-[10px] mb-1.5">{label}</p>
      <p
        className={clsx(
          "instrument-digits font-semibold leading-none",
          size === "lg" ? "text-3xl" : "text-xl"
        )}
      >
        {value}
        {unit && (
          <span className="text-sm font-normal text-text-muted ml-1.5 align-middle">
            {unit}
          </span>
        )}
      </p>
      {sublabel && (
        <p className="text-[11px] text-text-muted mt-1.5">{sublabel}</p>
      )}
    </div>
  );
}
