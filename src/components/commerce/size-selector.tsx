"use client";

import { cn } from "@/lib/cn";
import { formatSize } from "@/lib/format";

export function SizeSelector({
  sizes,
  value,
  onChange,
}: {
  sizes: number[];
  value: number;
  onChange: (ml: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="listbox" aria-label="Bottle size">
      {sizes.map((ml) => {
        const selected = ml === value;
        return (
          <button
            key={ml}
            type="button"
            role="option"
            aria-selected={selected}
            onClick={() => onChange(ml)}
            className={cn(
              "min-h-11 min-w-11 rounded-xs border px-3 py-2 font-mono text-sm transition-colors",
              selected
                ? "border-ink bg-ink text-paper"
                : "border-hairline bg-transparent text-taupe hover:border-ink",
            )}
          >
            {formatSize(ml)}
          </button>
        );
      })}
    </div>
  );
}
