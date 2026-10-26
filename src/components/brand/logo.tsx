/**
 * NS Perfume identity (generated outlines, no runtime font).
 * The monogram is an NS ligature: the N's diagonal flows into the S, one stroke
 * from structure to trail, the way a scent moves from top notes to its drydown.
 * Ink follows currentColor; brass parts use the brand token.
 */
import { cn } from "@/lib/cn";
import { HORIZONTAL, MONOGRAM } from "@/components/brand/paths";

type MarkProps = { className?: string; title?: string };

/** Monogram only. Brass by default; tone="current" follows the text color. */
export function LogoMark({
  className,
  title = "NS Perfume",
  tone = "brass",
}: MarkProps & { tone?: "brass" | "current" }) {
  return (
    <svg viewBox={`0 0 ${MONOGRAM.width} ${MONOGRAM.height}`} role="img" aria-label={title} className={cn("w-auto", className)}>
      <path d={MONOGRAM.d} className={tone === "brass" ? "fill-brass" : undefined} fill={tone === "brass" ? undefined : "currentColor"} />
    </svg>
  );
}

/** Horizontal lockup: brass monogram, hairline, NS PERFUME wordmark. Size with a height class. */
export function Logo({ className, title = "NS Perfume" }: MarkProps) {
  const { rule } = HORIZONTAL;
  return (
    <svg viewBox={`0 0 ${HORIZONTAL.width} ${HORIZONTAL.height}`} role="img" aria-label={title} className={cn("w-auto", className)}>
      <path transform={`scale(${HORIZONTAL.monogramScale})`} d={MONOGRAM.d} className="fill-brass" />
      <rect x={rule.x} y={rule.y} width={rule.width} height={rule.height} className="fill-brass" />
      <path d={HORIZONTAL.wordmark} fill="currentColor" />
    </svg>
  );
}
