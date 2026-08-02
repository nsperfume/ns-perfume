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

export type WishlistItem = {
  productHandle: string;
  name: string;
  image: string;
  pricePkr: number;
};

type WishlistContextValue = {
  items: WishlistItem[];
  count: number;
  addItem: (item: WishlistItem) => void;
  removeItem: (productHandle: string) => void;
  toggleItem: (item: WishlistItem) => void;
  isSaved: (productHandle: string) => boolean;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);
const STORAGE_KEY = "ns-perfume-wishlist";

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as WishlistItem[]);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback((item: WishlistItem) => {
    setItems((prev) =>
      prev.some((i) => i.productHandle === item.productHandle)
        ? prev
        : [...prev, item],
    );
  }, []);

  const removeItem = useCallback((productHandle: string) => {
    setItems((prev) => prev.filter((i) => i.productHandle !== productHandle));
  }, []);

  const toggleItem = useCallback((item: WishlistItem) => {
    setItems((prev) => {
      if (prev.some((i) => i.productHandle === item.productHandle)) {
        return prev.filter((i) => i.productHandle !== item.productHandle);
      }
      return [...prev, item];
    });
  }, []);

  const isSaved = useCallback(
    (productHandle: string) =>
      items.some((i) => i.productHandle === productHandle),
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      count: items.length,
      addItem,
      removeItem,
      toggleItem,
      isSaved,
    }),
    [items, addItem, removeItem, toggleItem, isSaved],
  );

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
