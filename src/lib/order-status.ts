/** Order status presentation helpers (Shopify-style order status page). */

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

export type TimelineStep = {
  id: string;
  label: string;
  description: string;
  /** completed | current | upcoming | cancelled */
  state: "done" | "current" | "upcoming" | "cancelled";
  at?: string | null;
};

export type MapCoords = {
  lat: number;
  lng: number;
  label: string;
  /** How precise the pin is */
  precision: "address" | "city" | "region";
};

/** City-level fallbacks when remote geocoding is unavailable. */
export const PK_CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  lahore: { lat: 31.5204, lng: 74.3587 },
  karachi: { lat: 24.8607, lng: 67.0011 },
  islamabad: { lat: 33.6844, lng: 73.0479 },
  rawalpindi: { lat: 33.5651, lng: 73.0169 },
  faisalabad: { lat: 31.4504, lng: 73.135 },
  multan: { lat: 30.1575, lng: 71.5249 },
  peshawar: { lat: 34.0151, lng: 71.5249 },
  quetta: { lat: 30.1798, lng: 66.975 },
  sialkot: { lat: 32.4945, lng: 74.5229 },
  gujranwala: { lat: 32.1877, lng: 74.1945 },
  hyderabad: { lat: 25.396, lng: 68.3578 },
  abbottabad: { lat: 34.1688, lng: 73.2215 },
  bahawalpur: { lat: 29.3956, lng: 71.6836 },
  sargodha: { lat: 32.0836, lng: 72.6711 },
  sukkur: { lat: 27.7052, lng: 68.8574 },
};

export const PROVINCE_COORDS: Record<string, { lat: number; lng: number }> = {
  punjab: { lat: 31.1471, lng: 75.3412 },
  sindh: { lat: 25.8943, lng: 68.5247 },
  "khyber pakhtunkhwa": { lat: 34.9526, lng: 72.3311 },
  balochistan: { lat: 28.4907, lng: 65.0958 },
  "islamabad capital territory": { lat: 33.6844, lng: 73.0479 },
  "gilgit-baltistan": { lat: 35.8026, lng: 74.9832 },
  "azad jammu and kashmir": { lat: 33.9259, lng: 73.781 },
};

export function statusHeadline(status: OrderStatus): string {
  switch (status) {
    case "pending":
      return "Your order is being reviewed";
    case "confirmed":
      return "Your order is confirmed";
    case "shipped":
      return "Your order is on the way";
    case "delivered":
      return "Your order was delivered";
    case "cancelled":
      return "Your order was cancelled";
    default:
      return "Order status";
  }
}

export function statusSubcopy(status: OrderStatus): string {
  switch (status) {
    case "pending":
      return "We’re confirming payment details. You’ll get an email when the order moves forward.";
    case "confirmed":
      return "We’ve received your order and are preparing it for shipment.";
    case "shipped":
      return "Your package has left our warehouse. Track progress below.";
    case "delivered":
      return "Thanks for shopping with NS Perfume. We hope the fragrance wears well.";
    case "cancelled":
      return "This order was cancelled. Contact care@nsperfume.com if you have questions.";
    default:
      return "";
  }
}

export function buildTimeline(
  status: OrderStatus,
  dates: {
    createdAt?: string | Date | null;
    confirmedAt?: string | Date | null;
    shippedAt?: string | Date | null;
    deliveredAt?: string | Date | null;
    cancelledAt?: string | Date | null;
  },
): TimelineStep[] {
  const iso = (d?: string | Date | null) =>
    d ? new Date(d).toISOString() : null;

  if (status === "cancelled") {
    return [
      {
        id: "placed",
        label: "Order placed",
        description: "We received your order.",
        state: "done",
        at: iso(dates.createdAt),
      },
      {
        id: "cancelled",
        label: "Cancelled",
        description: "This order will not ship.",
        state: "cancelled",
        at: iso(dates.cancelledAt || dates.createdAt),
      },
    ];
  }

  const rank: Record<OrderStatus, number> = {
    pending: 0,
    confirmed: 1,
    shipped: 2,
    delivered: 3,
    cancelled: -1,
  };
  const r = rank[status] ?? 0;

  const steps: TimelineStep[] = [
    {
      id: "placed",
      label: "Order placed",
      description: "We received your order.",
      state: r > 0 ? "done" : r === 0 ? "current" : "upcoming",
      at: iso(dates.createdAt),
    },
    {
      id: "confirmed",
      label: "Confirmed",
      description: "Payment accepted and order confirmed.",
      state: r > 1 ? "done" : r === 1 ? "current" : "upcoming",
      at: iso(dates.confirmedAt) || (r >= 1 ? iso(dates.createdAt) : null),
    },
    {
      id: "shipped",
      label: "Shipped",
      description: "Package handed to courier.",
      state: r > 2 ? "done" : r === 2 ? "current" : "upcoming",
      at: iso(dates.shippedAt),
    },
    {
      id: "delivered",
      label: "Delivered",
      description: "Package delivered to the address.",
      state: r >= 3 ? "done" : "upcoming",
      at: iso(dates.deliveredAt),
    },
  ];

  if (status === "pending") {
    steps[0].state = "done";
    steps[1] = {
      ...steps[1],
      label: "Confirming",
      description: "Reviewing payment (COD holds, bank, or card).",
      state: "current",
    };
  }

  return steps;
}

export function resolveMapCoords(address: {
  address1?: string;
  city?: string;
  province?: string;
  country?: string;
}): MapCoords {
  const cityKey = (address.city || "").trim().toLowerCase();
  const provinceKey = (address.province || "").trim().toLowerCase();
  const label = [address.address1, address.city, address.province]
    .filter(Boolean)
    .join(", ");

  if (cityKey && PK_CITY_COORDS[cityKey]) {
    const c = PK_CITY_COORDS[cityKey];
    return {
      lat: c.lat,
      lng: c.lng,
      label: label || address.city || "Delivery",
      precision: "city",
    };
  }

  // partial city match
  for (const [name, c] of Object.entries(PK_CITY_COORDS)) {
    if (cityKey.includes(name) || name.includes(cityKey)) {
      return {
        lat: c.lat,
        lng: c.lng,
        label: label || name,
        precision: "city",
      };
    }
  }

  if (provinceKey && PROVINCE_COORDS[provinceKey]) {
    const c = PROVINCE_COORDS[provinceKey];
    return {
      lat: c.lat,
      lng: c.lng,
      label: label || address.province || "Pakistan",
      precision: "region",
    };
  }

  // Pakistan center fallback
  return {
    lat: 30.3753,
    lng: 69.3451,
    label: label || "Pakistan",
    precision: "region",
  };
}

export function addBusinessDays(from: Date, days: number): Date {
  const d = new Date(from);
  let left = days;
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) left -= 1;
  }
  return d;
}

export function estimateDeliveryRange(
  createdAt: Date | string,
  shippingMethodId?: string,
): { from: string; to: string } {
  const start = new Date(createdAt);
  const minDays = shippingMethodId === "express" ? 1 : 3;
  const maxDays = shippingMethodId === "express" ? 2 : 5;
  return {
    from: addBusinessDays(start, minDays).toISOString(),
    to: addBusinessDays(start, maxDays).toISOString(),
  };
}

export function formatStatusDate(iso?: string | null): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("en-PK", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export function formatDayRange(fromIso: string, toIso: string): string {
  const opts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
  };
  const a = new Intl.DateTimeFormat("en-PK", opts).format(new Date(fromIso));
  const b = new Intl.DateTimeFormat("en-PK", {
    ...opts,
    year: "numeric",
  }).format(new Date(toIso));
  return `${a} to ${b}`;
}
