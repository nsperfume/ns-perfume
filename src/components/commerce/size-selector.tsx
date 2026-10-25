"use client";

import { cn } from "@/lib/cn";

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
              "inline-flex min-h-12 min-w-[4.5rem] items-center justify-center rounded-xs border px-4 font-mono text-sm font-medium transition-colors",
              selected
                ? "border-ink bg-ink text-paper"
                : "border-[#d6cfbf] bg-paper text-ink hover:border-ink",
            )}
          >
            {ml} ml
          </button>
        );
      })}
    </div>
  );
}
