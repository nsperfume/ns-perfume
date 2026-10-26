/**
 * Base currency is PKR (Pakistan). All product prices are stored in PKR.
 * Rates convert 1 PKR → target currency (or inverse for display from PKR amount).
 */

export const CURRENCIES = [
  { code: "PKR", label: "PKR", symbol: "Rs", locale: "en-PK" },
  { code: "USD", label: "USD", symbol: "$", locale: "en-US" },
  { code: "AED", label: "AED", symbol: "AED", locale: "en-AE" },
  { code: "SAR", label: "SAR", symbol: "SAR", locale: "en-SA" },
  { code: "GBP", label: "GBP", symbol: "£", locale: "en-GB" },
  { code: "EUR", label: "EUR", symbol: "€", locale: "en-EU" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];

export const DEFAULT_CURRENCY: CurrencyCode = "PKR";
export const BASE_CURRENCY: CurrencyCode = "PKR";

export type RatesMap = Record<string, number>;

let memoryCache: { rates: RatesMap; fetchedAt: number } | null = null;
const TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

/** Rates relative to 1 PKR */
export async function fetchPkrRates(): Promise<{
  rates: RatesMap;
  updatedAt: string;
  source: string;
}> {
  if (memoryCache && Date.now() - memoryCache.fetchedAt < TTL_MS) {
    return {
      rates: memoryCache.rates,
      updatedAt: new Date(memoryCache.fetchedAt).toISOString(),
      source: "cache",
    };
  }

  try {
    // Free, no key: open.er-api.com
    const res = await fetch("https://open.er-api.com/v6/latest/PKR", {
      next: { revalidate: 21600 },
    });
    if (!res.ok) throw new Error(`Rate API ${res.status}`);
    const data = (await res.json()) as {
      result: string;
      rates: RatesMap;
      time_last_update_utc?: string;
    };
    if (data.result !== "success" || !data.rates) {
      throw new Error("Invalid rate payload");
    }
    const rates: RatesMap = { PKR: 1, ...data.rates };
    memoryCache = { rates, fetchedAt: Date.now() };
    return {
      rates,
      updatedAt: data.time_last_update_utc || new Date().toISOString(),
      source: "open.er-api.com",
    };
  } catch {
    // Approximate fallback if network fails (updated periodically)
    const fallback: RatesMap = {
      PKR: 1,
      USD: 0.0036,
      AED: 0.0132,
      SAR: 0.0135,
      GBP: 0.0028,
      EUR: 0.0033,
    };
    memoryCache = { rates: fallback, fetchedAt: Date.now() };
    return {
      rates: fallback,
      updatedAt: new Date().toISOString(),
      source: "fallback",
    };
  }
}

/** True when a usable PKR → `code` rate is loaded. PKR always converts 1:1. */
export function hasRate(code: string, rates: RatesMap): boolean {
  if (code === BASE_CURRENCY) return true;
  const rate = rates[code];
  return typeof rate === "number" && Number.isFinite(rate) && rate > 0;
}

/** Returns null when the rate is missing, so callers never label PKR as another currency. */
export function convertFromPkr(
  amountPkr: number,
  to: string,
  rates: RatesMap,
): number | null {
  if (!hasRate(to, rates)) return null;
  return to === BASE_CURRENCY ? amountPkr : amountPkr * rates[to];
}

/** Orders are charged in PKR, so payable amounts always use this. */
export function formatPkr(amountPkr: number): string {
  return formatMoney(amountPkr, BASE_CURRENCY, { [BASE_CURRENCY]: 1 });
}

/** Formats a PKR amount in `currency`, falling back to PKR when that rate is not loaded. */
export function formatMoney(
  amountPkr: number,
  currency: string,
  rates: RatesMap,
): string {
  const value = convertFromPkr(amountPkr, currency, rates);
  if (value === null) return formatPkr(amountPkr);
  const meta = CURRENCIES.find((c) => c.code === currency);
  const locale = meta?.locale || "en-PK";
  const fraction = currency === "PKR" ? 0 : 2;
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: fraction,
      maximumFractionDigits: fraction,
    }).format(value);
  } catch {
    return `${meta?.symbol || currency} ${value.toFixed(fraction)}`;
  }
}
