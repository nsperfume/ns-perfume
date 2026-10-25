"use client";

import { useCurrency } from "@/context/currency";
import { cn } from "@/lib/cn";

type SizeOption = { ml: number; price: number };

/**
 * The larger size that is cheaper per ml than the smallest one, if any.
 * Returns null when buying bigger does not save anything.
 */
function bestValueMl(options: SizeOption[]): number | null {
  const valid = options.filter((o) => o.ml > 0 && o.price > 0);
  if (valid.length < 2) return null;
  const smallest = valid.reduce((a, b) => (b.ml < a.ml ? b : a));
  const cheapest = valid.reduce((a, b) =>
    b.price / b.ml < a.price / a.ml ? b : a,
  );
  if (cheapest.ml === smallest.ml) return null;
  return cheapest.price / cheapest.ml < smallest.price / smallest.ml
    ? cheapest.ml
    : null;
}

export function SizeSelector({
  sizes,
  prices,
  value,
  onChange,
}: {
  sizes: number[];
  /** Price per size (PKR). When given, each button shows its price under the ml. */
  prices?: SizeOption[];
  value: number;
  onChange: (ml: number) => void;
}) {
  const { format } = useCurrency();
  const best = prices ? bestValueMl(prices) : null;

  return (
    <div
      className="flex flex-wrap gap-2 pt-2"
      role="radiogroup"
      aria-label="Bottle size"
    >
      {sizes.map((ml) => {
        const selected = ml === value;
        const price = prices?.find((p) => p.ml === ml)?.price;
        const isBest = best === ml;
        return (
          <button
            key={ml}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(ml)}
            className={cn(
              "relative inline-flex min-h-14 min-w-22 flex-col items-center justify-center rounded-xs border px-4 pb-2 pt-2.5 font-mono transition-colors",
              selected
                ? "border-ink bg-ink text-paper"
                : "border-[#d6cfbf] bg-paper text-ink hover:border-ink",
            )}
          >
            {isBest ? (
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-brass/50 bg-paper px-2 font-sans text-xs font-semibold leading-4 text-brass-ink">
                Best value
              </span>
            ) : null}
            <span className="text-sm font-medium leading-tight">{ml} ml</span>
            {price ? (
              <span
                className={cn(
                  "mt-0.5 text-xs leading-tight",
                  selected ? "text-paper/75" : "text-taupe",
                )}
              >
                {format(price)}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
