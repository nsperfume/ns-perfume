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
