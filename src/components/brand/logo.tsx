/**
 * NS Perfume identity (generated outlines, no runtime font). Geometry comes from
 * scripts/brand/build-brand.mjs.
 * The monogram is an NS ligature: the N's diagonal flows into the S, one stroke
 * from structure to trail, the way a scent moves from top notes to its drydown.
 * The crown above it is three tapered spikes (top, heart, base notes) with pearls.
 * Ink follows currentColor; brass parts use the brand token.
 */
import { cn } from "@/lib/cn";
import { CROWNED, HORIZONTAL, MONOGRAM } from "@/components/brand/paths";

type MarkProps = { className?: string; title?: string };

/** Crowned NS mark. Brass by default; tone="current" follows the text color. */
export function LogoMark({
  className,
  title = "NS Perfume",
  tone = "brass",
}: MarkProps & { tone?: "brass" | "current" }) {
  const fill = tone === "brass" ? undefined : "currentColor";
  const fillClass = tone === "brass" ? "fill-brass" : undefined;
  return (
    <svg viewBox={`0 0 ${CROWNED.width} ${CROWNED.height}`} role="img" aria-label={title} className={cn("w-auto", className)}>
      <path d={CROWNED.crown} className={fillClass} fill={fill} />
      <path transform={`translate(0 ${CROWNED.monogramY})`} d={MONOGRAM.d} className={fillClass} fill={fill} />
    </svg>
  );
}

/**
 * Horizontal lockup: crowned brass NS, a hairline, then PERFUME (the monogram
 * already says NS). Size with a height class.
 */
export function Logo({ className, title = "NS Perfume" }: MarkProps) {
  const { rule } = HORIZONTAL;
  return (
    <svg viewBox={`0 0 ${HORIZONTAL.width} ${HORIZONTAL.height}`} role="img" aria-label={title} className={cn("w-auto", className)}>
      <g transform={`scale(${HORIZONTAL.markScale})`} className="fill-brass">
        <path d={CROWNED.crown} />
        <path transform={`translate(0 ${CROWNED.monogramY})`} d={MONOGRAM.d} />
      </g>
      <rect x={rule.x} y={rule.y} width={rule.width} height={rule.height} className="fill-brass" />
      <path d={HORIZONTAL.wordmark} fill="currentColor" />
    </svg>
  );
}
