"use client";

/**
 * NS Perfume identity (generated outlines, no runtime font). Geometry and the
 * metallic gold come from scripts/brand/build-brand.mjs.
 * The monogram is an NS ligature: the N's diagonal flows into the S, one stroke
 * from structure to trail, the way a scent moves from top notes to its drydown.
 * The crown above it is a classic five-point rim with pearls and a jewelled band.
 * Ink follows currentColor; the mark and hairline are metallic gold.
 */
import { useId } from "react";
import { cn } from "@/lib/cn";
import { CROWNED, GOLD, GOLD_RULE, HORIZONTAL, MONOGRAM } from "@/components/brand/paths";

type MarkProps = { className?: string; title?: string };

/** Gold gradient in crowned-mark units; one sheen across crown and letters. */
function GoldGradient({ id }: { id: string }) {
  return (
    <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={GOLD.x1} y1={GOLD.y1} x2={GOLD.x2} y2={GOLD.y2}>
      {GOLD.stops.map(([offset, color]) => (
        <stop key={offset} offset={offset} stopColor={color} />
      ))}
    </linearGradient>
  );
}

/** Crowned NS mark. Metallic gold by default; tone="current" follows the text color. */
export function LogoMark({
  className,
  title = "NS Perfume",
  tone = "gold",
}: MarkProps & { tone?: "gold" | "current" }) {
  const id = useId().replace(/:/g, "");
  const fill = tone === "gold" ? `url(#${id}-gold)` : "currentColor";
  return (
    <svg viewBox={`0 0 ${CROWNED.width} ${CROWNED.height}`} role="img" aria-label={title} className={cn("w-auto", className)}>
      {tone === "gold" ? (
        <defs>
          <GoldGradient id={`${id}-gold`} />
        </defs>
      ) : null}
      <g fill={fill}>
        <path d={CROWNED.crown} />
        <path transform={`translate(0 ${CROWNED.monogramY})`} d={MONOGRAM.d} />
      </g>
    </svg>
  );
}

/**
 * Horizontal lockup: crowned gold NS, a gold hairline, then PERFUME (the
 * monogram already says NS). Size with a height class.
 */
export function Logo({ className, title = "NS Perfume" }: MarkProps) {
  const id = useId().replace(/:/g, "");
  const { rule } = HORIZONTAL;
  return (
    <svg viewBox={`0 0 ${HORIZONTAL.width} ${HORIZONTAL.height}`} role="img" aria-label={title} className={cn("w-auto", className)}>
      <defs>
        <GoldGradient id={`${id}-gold`} />
        <linearGradient id={`${id}-rule`} gradientUnits="userSpaceOnUse" x1={0} y1={rule.y} x2={0} y2={rule.y + rule.height}>
          {GOLD_RULE.map(([offset, color]) => (
            <stop key={offset} offset={offset} stopColor={color} />
          ))}
        </linearGradient>
      </defs>
      <g transform={`scale(${HORIZONTAL.markScale})`} fill={`url(#${id}-gold)`}>
        <path d={CROWNED.crown} />
        <path transform={`translate(0 ${CROWNED.monogramY})`} d={MONOGRAM.d} />
      </g>
      <rect x={rule.x} y={rule.y} width={rule.width} height={rule.height} fill={`url(#${id}-rule)`} />
      <path d={HORIZONTAL.wordmark} fill="currentColor" />
    </svg>
  );
}
