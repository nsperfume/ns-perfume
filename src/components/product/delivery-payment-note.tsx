"use client";

import { useCheckoutConfig } from "@/context/checkout-config";
import { useCurrency } from "@/context/currency";
import { enabledShippingMethods } from "@/lib/checkout-config";

/** Delivery and payment terms from the owner's checkout settings. */
export function DeliveryPaymentNote({ className }: { className?: string }) {
  const config = useCheckoutConfig();
  const { format } = useCurrency();
  const methods = enabledShippingMethods(config);
  const threshold = config.freeShippingThresholdPkr;

  return (
    <p className={className}>
      Pay by cash on delivery
      {config.codFeePkr > 0 ? ` (${format(config.codFeePkr)} fee)` : ""}, bank
      transfer, JazzCash, or Easypaisa.{" "}
      {methods
        .map((m) => `${m.title} delivery takes ${m.description}`)
        .join("; ")}
      .
      {threshold > 0
        ? ` Standard delivery is free on orders over ${format(threshold)}.`
        : ""}
    </p>
  );
}
