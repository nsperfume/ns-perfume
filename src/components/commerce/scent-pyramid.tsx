import { cn } from "@/lib/cn";

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
  variant?: "default" | "divider";
  className?: string;
}) {
  const bands = [
    { label: "Top Notes", notes: topNotes, width: "w-full max-w-md" },
    { label: "Heart Notes", notes: heartNotes, width: "w-[82%] max-w-sm" },
    { label: "Base Notes", notes: baseNotes, width: "w-[64%] max-w-xs" },
  ];

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-6",
        variant === "divider" && "section-y",
        className,
      )}
    >
      <div className="flex w-full flex-col items-center gap-4 md:gap-6">
        {bands.map((band) => (
          <div
            key={band.label}
            className={cn("flex flex-col items-center gap-2", band.width)}
          >
            <div className="h-px w-full bg-brass" aria-hidden />
            <p className="text-caption font-medium text-taupe">{band.label}</p>
            <p className="text-center text-body text-ink/90">
              {band.notes.join(" · ")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
