"use client";

import { InfoTip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";

const SCALE = [
  { n: 1, label: "Soft" },
  { n: 2, label: "Light" },
  { n: 3, label: "Moderate" },
  { n: 4, label: "Strong" },
  { n: 5, label: "Bold" },
] as const;

const SILLAGE_TIP =
  "Sillage is how far the scent projects from your skin into the room. Soft stays close. Bold fills more space around you.";

const LONGEVITY_TIP =
  "Longevity is how long the scent stays noticeable on skin before it fades. Higher scores last through a longer day or evening.";

function MeterRow({
  label,
  hint,
  tip,
  tipLabel,
  value,
  compact,
}: {
  label: string;
  hint: string;
  tip: string;
  tipLabel: string;
  value: number;
  compact?: boolean;
}) {
  const clamped = Math.min(5, Math.max(1, Math.round(value)));
  const word = SCALE[clamped - 1]?.label ?? "";

  if (compact) {
    return (
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 font-display text-[10px] font-medium uppercase tracking-[0.12em] text-taupe">
          {label}
          <InfoTip content={tip} label={tipLabel} />
        </span>
        <div className="flex items-center gap-2">
          <div className="flex gap-1" aria-hidden>
            {SCALE.map((step) => (
              <span
                key={step.n}
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  step.n <= clamped ? "bg-brass" : "bg-hairline",
                )}
              />
            ))}
          </div>
          <span className="font-mono text-[10px] tabular-nums text-taupe">
            {clamped}/5
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="space-y-3"
      role="img"
      aria-label={`${label}: ${clamped} out of 5, ${word}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 font-display text-[0.95rem] font-medium text-ink">
            {label}
            <InfoTip content={tip} label={tipLabel} />
          </p>
          <p className="mt-0.5 font-serif text-[0.9rem] leading-snug text-taupe">
            {hint}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-mono text-[1.05rem] font-medium tabular-nums text-ink">
            {clamped}/5
          </p>
          <p className="mt-0.5 font-display text-[10px] font-medium uppercase tracking-[0.12em] text-taupe">
            {word}
          </p>
        </div>
      </div>

      <div className="flex items-end gap-1.5 sm:gap-2">
        {SCALE.map((step) => {
          const on = step.n <= clamped;
          return (
            <div
              key={step.n}
              className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
            >
              <span
                className={cn(
                  "block w-full max-w-none rounded-sm transition-colors",
                  on ? "bg-ink" : "bg-hairline",
                  step.n === 1 && "h-3",
                  step.n === 2 && "h-4",
                  step.n === 3 && "h-5",
                  step.n === 4 && "h-6",
                  step.n === 5 && "h-7",
                )}
              />
              <span
                className={cn(
                  "font-display text-[9px] uppercase tracking-[0.08em]",
                  on ? "text-ink/70" : "text-taupe/45",
                )}
              >
                {step.n}
              </span>
            </div>
          );
        })}
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
    <div
      className={cn(
        compact ? "flex flex-col gap-2.5" : "flex flex-col gap-6",
        className,
      )}
    >
      {!compact ? (
        <div className="border-b border-hairline pb-3">
          <p className="font-display text-[11px] font-medium uppercase tracking-[0.14em] text-taupe">
            Performance
          </p>
          <p className="mt-1 font-serif text-[0.95rem] text-taupe">
            How far it projects, and how long it stays.
          </p>
        </div>
      ) : null}
      <MeterRow
        label="Sillage"
        hint="Projection around you"
        tip={SILLAGE_TIP}
        tipLabel="What is sillage?"
        value={sillage}
        compact={compact}
      />
      <MeterRow
        label="Longevity"
        hint="Hours on skin"
        tip={LONGEVITY_TIP}
        tipLabel="What is longevity?"
        value={longevity}
        compact={compact}
      />
    </div>
  );
}
