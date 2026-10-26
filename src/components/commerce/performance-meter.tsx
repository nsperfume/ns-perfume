"use client";

import { InfoTip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";

type Scale = readonly { n: number; label: string }[];

/** How far the scent reaches (perfumers call it sillage). */
const PROJECTION_SCALE: Scale = [
  { n: 1, label: "Soft" },
  { n: 2, label: "Light" },
  { n: 3, label: "Moderate" },
  { n: 4, label: "Strong" },
  { n: 5, label: "Bold" },
];

/** How long it stays on skin. */
const LONGEVITY_SCALE: Scale = [
  { n: 1, label: "Brief" },
  { n: 2, label: "Short" },
  { n: 3, label: "Moderate" },
  { n: 4, label: "Long" },
  { n: 5, label: "All day" },
];

const SCALE = PROJECTION_SCALE;

const SILLAGE_TIP =
  "Projection (sillage) is how far the scent reaches from your skin into the room. Soft stays close. Bold fills more space around you.";

const LONGEVITY_TIP =
  "Longevity is how long the scent stays noticeable on skin before it fades. Higher scores last through a longer day or evening.";

function MeterRow({
  label,
  hint,
  tip,
  tipLabel,
  value,
  scale,
  compact,
}: {
  label: string;
  hint: string;
  tip: string;
  tipLabel: string;
  value: number;
  scale: Scale;
  compact?: boolean;
}) {
  const clamped = Math.min(5, Math.max(1, Math.round(value)));
  const word = scale[clamped - 1]?.label ?? "";

  if (compact) {
    return (
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-eyebrow text-taupe">
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
          <span className="font-sans tabular-nums text-xs text-taupe">
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
          <p className="inline-flex items-center gap-1.5 text-heading-sm text-ink">
            {label}
            <InfoTip content={tip} label={tipLabel} />
          </p>
          <p className="mt-0.5 text-body-sm leading-snug text-taupe">
            {hint}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-sans tabular-nums text-lg font-medium text-ink">
            {clamped}/5
          </p>
          <p className="mt-0.5 text-eyebrow text-taupe">
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
                  on ? "bg-brass" : "bg-hairline",
                  step.n === 1 && "h-3",
                  step.n === 2 && "h-4",
                  step.n === 3 && "h-5",
                  step.n === 4 && "h-6",
                  step.n === 5 && "h-7",
                )}
              />

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
          <p className="text-eyebrow text-taupe">
            Performance
          </p>
          <p className="mt-1 text-body-sm text-taupe">
            How far it projects, and how long it stays.
          </p>
        </div>
      ) : null}
      <MeterRow
        label="Projection"
        hint="How far it reaches"
        tip={SILLAGE_TIP}
        tipLabel="What is projection?"
        value={sillage}
        scale={PROJECTION_SCALE}
        compact={compact}
      />
      <MeterRow
        label="Longevity"
        hint="How long it lasts on skin"
        tip={LONGEVITY_TIP}
        tipLabel="What is longevity?"
        value={longevity}
        scale={LONGEVITY_SCALE}
        compact={compact}
      />
    </div>
  );
}

/**
 * One-line meter for the buy box: label, five brass segments, score.
 * Same data and scale as PerformanceMeter.
 */
export function PerformanceMini({
  sillage,
  longevity,
  className,
}: {
  sillage: number;
  longevity: number;
  className?: string;
}) {
  const rows = [
    { label: "Projection", value: sillage, scale: PROJECTION_SCALE },
    { label: "Longevity", value: longevity, scale: LONGEVITY_SCALE },
  ];
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-6 gap-y-2",
        className,
      )}
    >
      {rows.map((row) => {
        const clamped = Math.min(5, Math.max(1, Math.round(row.value)));
        const word = row.scale[clamped - 1]?.label ?? "";
        return (
          <div
            key={row.label}
            className="inline-flex items-center gap-2.5"
            role="img"
            aria-label={`${row.label}: ${clamped} out of 5, ${word}`}
          >
            <span className="min-w-[4.25rem] text-caption text-taupe">{row.label}</span>
            <span className="flex gap-0.5" aria-hidden>
              {SCALE.map((step) => (
                <span
                  key={step.n}
                  className={cn(
                    "h-2 w-3.5 rounded-[1px]",
                    step.n <= clamped ? "bg-brass" : "bg-hairline",
                  )}
                />
              ))}
            </span>
            <span className="font-sans tabular-nums text-xs font-medium text-ink">
              {clamped}/5
            </span>
          </div>
        );
      })}
    </div>
  );
}
