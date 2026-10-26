"use client";

import { useEffect, useState } from "react";
import { useCheckoutConfig } from "@/context/checkout-config";
import { estimateDeliveryRange } from "@/lib/order-status";

const TZ = "Asia/Karachi";

/** Today's calendar date in Karachi, as a local Date at noon (safe for day math). */
function karachiToday(): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return new Date(get("year"), get("month") - 1, get("day"), 12);
}

function formatDay(iso: string) {
  // e.g. "Wed 29 Oct"
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })
    .format(new Date(iso))
    .replace(",", "");
}

/**
 * Standard-delivery window from today. Computed in the browser so cached
 * (ISR) pages never show stale dates; renders a neutral line until mounted.
 */
export function DeliveryEstimate({ className }: { className?: string }) {
  const config = useCheckoutConfig();
  // First method the owner offers: standard, else express.
  const method = config.shipping.standard.enabled ? "standard" : "express";
  const fallback = `Delivered in ${config.shipping[method].description}`;
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const { from, to } = estimateDeliveryRange(karachiToday(), method, config.shipping[method].description);
    setLabel(
      `Order today, delivered between ${formatDay(from)} and ${formatDay(to)}`,
    );
  }, [method, config]);

  return <span className={className}>{label ?? fallback}</span>;
}
