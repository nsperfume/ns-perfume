import { cn } from "@/lib/cn";

type Props = {
  rating: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  showValue?: boolean;
};

/**
 * Professional 5-star rating with filled / half / empty glyphs.
 */
export function StarRating({
  rating,
  size = "md",
  className,
  showValue = false,
}: Props) {
  const clamped = Math.max(0, Math.min(5, rating));
  const dim =
    size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-5 w-5" : "h-4 w-4";
  const uid = `sr-${clamped.toFixed(2).replace(".", "")}-${size}`;

  return (
    <span
      className={cn("inline-flex items-center gap-2", className)}
      aria-label={`${clamped.toFixed(1)} out of 5 stars`}
    >
      <span className="inline-flex items-center gap-0.5" aria-hidden>
        {Array.from({ length: 5 }, (_, i) => {
          const fill = Math.min(1, Math.max(0, clamped - i));
          return (
            <StarIcon
              key={i}
              fill={fill}
              className={dim}
              clipId={`${uid}-${i}`}
            />
          );
        })}
      </span>
      {showValue ? (
        <span className="font-mono text-[13px] tabular-nums text-taupe">
          {clamped.toFixed(1)}
        </span>
      ) : null}
    </span>
  );
}

function StarIcon({
  fill,
  className,
  clipId,
}: {
  fill: number;
  className?: string;
  clipId: string;
}) {
  const path =
    "m12 2.5 2.9 5.88 6.49.94-4.7 4.58 1.11 6.47L12 17.27l-5.8 3.1 1.11-6.47-4.7-4.58 6.49-.94L12 2.5z";

  if (fill >= 0.95) {
    return (
      <svg viewBox="0 0 24 24" className={cn("shrink-0 text-brass", className)}>
        <path fill="currentColor" d={path} />
      </svg>
    );
  }

  if (fill <= 0.05) {
    return (
      <svg
        viewBox="0 0 24 24"
        className={cn("shrink-0 text-[#d4cbb8]", className)}
      >
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
          d={path}
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={cn("shrink-0 text-brass", className)}>
      <defs>
        <clipPath id={clipId}>
          <rect x="0" y="0" width={24 * fill} height="24" />
        </clipPath>
      </defs>
      <path
        fill="none"
        stroke="#d4cbb8"
        strokeWidth="1.4"
        strokeLinejoin="round"
        d={path}
      />
      <path fill="currentColor" clipPath={`url(#${clipId})`} d={path} />
    </svg>
  );
}
