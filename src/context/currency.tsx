"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  formatMoney,
  type CurrencyCode,
  type RatesMap,
} from "@/lib/currency";

type CurrencyContextValue = {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  rates: RatesMap;
  updatedAt: string | null;
  source: string | null;
  loading: boolean;
  format: (amountPkr: number) => string;
  currencies: typeof CURRENCIES;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);
const STORAGE_KEY = "ns-currency";

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(DEFAULT_CURRENCY);
  const [rates, setRates] = useState<RatesMap>({ PKR: 1 });
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as CurrencyCode | null;
      if (saved && CURRENCIES.some((c) => c.code === saved)) {
        setCurrencyState(saved);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/currency/rates");
        const json = await res.json();
        if (!cancelled && json.ok) {
          setRates(json.data.rates);
          setUpdatedAt(json.data.updatedAt);
          setSource(json.data.source);
        }
      } catch {
        /* keep PKR 1:1 */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setCurrency = useCallback((c: CurrencyCode) => {
    setCurrencyState(c);
    try {
      localStorage.setItem(STORAGE_KEY, c);
    } catch {
      /* ignore */
    }
  }, []);

  const format = useCallback(
    (amountPkr: number) => formatMoney(amountPkr, currency, rates),
    [currency, rates],
  );

  const value = useMemo(
    () => ({
      currency,
      setCurrency,
      rates,
      updatedAt,
      source,
      loading,
      format,
      currencies: CURRENCIES,
    }),
    [currency, setCurrency, rates, updatedAt, source, loading, format],
  );

  return (
    <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
