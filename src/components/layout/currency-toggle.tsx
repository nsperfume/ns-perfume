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
  const { displayCurrency, setCurrency, currencies, loading } = useCurrency();

  return (
    <Select
      value={displayCurrency}
      onValueChange={(v) => setCurrency(v as typeof displayCurrency)}
      disabled={loading}
      tone={tone}
      aria-label="Select currency"
      options={currencies.map((c) => ({ value: c.code, label: c.code }))}
      className={cn("min-w-0", className)}
      triggerClassName={cn(
        "min-h-10! min-w-[4.75rem] px-3 py-1.5 font-sans tabular-nums text-sm tracking-wide",
        tone === "dark" && "backdrop-blur-md",
      )}
    />
  );
}
