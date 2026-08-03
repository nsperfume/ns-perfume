/**
 * Short storefront order refs, e.g. NS-4821.
 * Easy to say on the phone and type on track-order.
 */
const PREFIX = "NS-";

export function generateOrderNumber(): string {
  // 4 digits, always 1000-9999: NS-4821
  const n = 1000 + Math.floor(Math.random() * 9000);
  return `${PREFIX}${n}`;
}

/** Longer fallback if a 4-digit code collides. */
export function generateOrderNumberFallback(): string {
  const mix = Date.now().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, "");
  return `${PREFIX}${mix.slice(-5)}`;
}

/**
 * Display formatting. Legacy `NS772829567` becomes `NS-772829567`.
 * Already hyphenated values pass through.
 */
export function formatOrderNumber(raw: string): string {
  const v = (raw || "").trim();
  if (!v) return v;
  const upper = v.toUpperCase();
  if (upper.startsWith("NS-")) return `NS-${upper.slice(3)}`;
  if (/^NS\d+$/i.test(v)) return `NS-${v.slice(2)}`;
  return v;
}
