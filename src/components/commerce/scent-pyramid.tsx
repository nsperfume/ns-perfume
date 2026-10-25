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
            className="grid grid-cols-[4.5rem_1fr] items-baseline gap-4 py-5 sm:grid-cols-[6rem_1fr]"
          >
            <dt className="text-eyebrow text-taupe">
              {band.label}
            </dt>
            <dd className="font-display text-[1.5rem] font-medium leading-snug text-ink sm:text-[1.75rem]">
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
            <dt className="text-eyebrow text-taupe">
              {band.label}
            </dt>
            <dd className="font-display text-[1.5rem] font-medium leading-snug text-ink sm:text-[1.75rem]">
              {band.notes.join(" · ")}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
