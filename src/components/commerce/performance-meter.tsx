import { cn } from "@/lib/cn";

function MeterRow({ label, value }: { label: string; value: number }) {
  const clamped = Math.min(5, Math.max(1, Math.round(value)));
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-eyebrow text-taupe">{label}</span>
        <span className="font-mono text-caption text-ink">
          {clamped}/5
        </span>
      </div>
      <div className="flex gap-1" aria-hidden>
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-xs",
              i < clamped ? "bg-brass" : "bg-hairline",
            )}
          />
        ))}
      </div>
    </div>
  );
}

export function PerformanceMeter({
  sillage,
  longevity,
  className,
  compact = false,
}: {
  sillage: number;
  longevity: number;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-col gap-3", compact && "gap-2", className)}>
      {!compact ? <p className="text-eyebrow text-taupe">Performance</p> : null}
      <MeterRow label="Sillage" value={sillage} />
      <MeterRow label="Longevity" value={longevity} />
    </div>
  );
}
