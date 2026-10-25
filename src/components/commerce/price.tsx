"use client";

import { useCurrency } from "@/context/currency";
import { cn } from "@/lib/cn";

export function Price({
  amountPkr,
  className,
}: {
  amountPkr: number;
  className?: string;
}) {
  const { format } = useCurrency();
  return <span className={cn("text-price text-brass", className)}>{format(amountPkr)}</span>;
}

/**
 * Amount the shopper actually pays. Orders are charged in PKR, so PKR leads and any
 * other display currency shows only as an approximate conversion.
 * `inline` reads inside a sentence; `stacked` puts the conversion on its own small line.
 */
export function PayableAmount({
  amountPkr,
  variant = "inline",
  className,
  approxClassName,
}: {
  amountPkr: number;
  variant?: "inline" | "stacked";
  className?: string;
  approxClassName?: string;
}) {
  const { format, formatPkr, displayCurrency } = useCurrency();
  const showApprox = displayCurrency !== "PKR";

  if (variant === "stacked") {
    return (
      <span className={cn("inline-flex flex-col", className)}>
        <span>{formatPkr(amountPkr)}</span>
        {showApprox ? (
          <span
            className={cn(
              "mt-0.5 font-serif text-[0.8rem] font-normal tracking-normal text-taupe",
              approxClassName,
            )}
          >
            approx. {format(amountPkr)}
          </span>
        ) : null}
      </span>
    );
  }

  return (
    <span className={className}>
      {formatPkr(amountPkr)}
      {showApprox ? (
        <span className={cn("font-normal text-taupe", approxClassName)}>
          {" "}
          (approx. {format(amountPkr)})
        </span>
      ) : null}
    </span>
  );
}
