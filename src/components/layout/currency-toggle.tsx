"use client";

import { Select } from "@/components/ui/select";
import { useCurrency } from "@/context/currency";
import { cn } from "@/lib/cn";

export function CurrencyToggle({
  className,
  tone = "light",
}: {
  className?: string;
  tone?: "light" | "dark";
}) {
  const { currency, setCurrency, currencies, loading } = useCurrency();

  return (
    <Select
      value={currency}
      onValueChange={(v) => setCurrency(v as typeof currency)}
      disabled={loading}
      tone={tone}
      aria-label="Select currency"
      options={currencies.map((c) => ({ value: c.code, label: c.code }))}
      className={cn("min-w-0", className)}
      triggerClassName={cn(
        "min-h-9 min-w-[4.5rem] px-2.5 py-1.5 font-mono text-xs tracking-wide",
        tone === "dark" && "backdrop-blur-md",
      )}
    />
  );
}
