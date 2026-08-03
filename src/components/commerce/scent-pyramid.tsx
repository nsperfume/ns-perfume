import { cn } from "@/lib/cn";

/** Editorial horizontal note rows (PDP + docs). */
export function ScentPyramid({
  topNotes,
  heartNotes,
  baseNotes,
  variant = "default",
  className,
}: {
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  variant?: "default" | "divider" | "inline";
  className?: string;
}) {
  const bands = [
    { label: "Top", notes: topNotes },
    { label: "Heart", notes: heartNotes },
    { label: "Base", notes: baseNotes },
  ];

  if (variant === "inline") {
    return (
      <dl className={cn("divide-y divide-hairline border-y border-hairline", className)}>
        {bands.map((band) => (
          <div
            key={band.label}
            className="grid grid-cols-[4rem_1fr] items-baseline gap-4 py-3.5 sm:grid-cols-[5rem_1fr]"
          >
            <dt className="font-display text-[10px] font-medium uppercase tracking-[0.16em] text-ink/45">
              {band.label}
            </dt>
            <dd className="font-serif text-[1.08rem] leading-snug text-ink">
              {band.notes.join(" · ")}
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-start gap-0",
        variant === "divider" && "section-y",
        className,
      )}
    >
      <dl className="w-full max-w-lg divide-y divide-hairline border-y border-hairline">
        {bands.map((band) => (
          <div
            key={band.label}
            className="grid grid-cols-[5rem_1fr] items-baseline gap-4 py-4"
          >
            <dt className="font-display text-[10px] font-medium uppercase tracking-[0.16em] text-ink/45">
              {band.label}
            </dt>
            <dd className="font-serif text-[1.1rem] leading-snug text-ink">
              {band.notes.join(" · ")}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
