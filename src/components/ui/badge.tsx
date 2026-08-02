import { cn } from "@/lib/cn";

export function ConcentrationBadge({
  concentration,
  className,
}: {
  concentration: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-ink bg-paper px-3 py-1 text-eyebrow text-ink",
        className,
      )}
    >
      {concentration}
    </span>
  );
}

export function ScarcityBadge({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-xs bg-rosewood px-2 py-1 text-eyebrow text-paper",
        className,
      )}
    >
      {label}
    </span>
  );
}
