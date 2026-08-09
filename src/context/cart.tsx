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
import type { CartLine } from "@/lib/types";

type CartContextValue = {
  lines: CartLine[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  addItems: (
    items: Array<Omit<CartLine, "quantity"> & { quantity?: number }>,
  ) => void;
  removeItem: (sku: string) => void;
  updateQuantity: (sku: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "ns-perfume-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw) as CartLine[]);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen((v) => !v), []);

  const addItem = useCallback(
    (line: Omit<CartLine, "quantity">, quantity = 1) => {
      setLines((prev) => {
        const existing = prev.find((l) => l.sku === line.sku);
        if (existing) {
          return prev.map((l) =>
            l.sku === line.sku ? { ...l, quantity: l.quantity + quantity } : l,
          );
        }
        return [...prev, { ...line, quantity }];
      });
      setIsOpen(true);
    },
    [],
  );

  const addItems = useCallback(
    (items: Array<Omit<CartLine, "quantity"> & { quantity?: number }>) => {
      if (!items.length) return;
      setLines((prev) => {
        let next = [...prev];
        for (const item of items) {
          const quantity = item.quantity ?? 1;
          const { quantity: _q, ...line } = item;
          const existing = next.find((l) => l.sku === line.sku);
          if (existing) {
            next = next.map((l) =>
              l.sku === line.sku
                ? { ...l, quantity: l.quantity + quantity }
                : l,
            );
          } else {
            next = [...next, { ...line, quantity }];
          }
        }
        return next;
      });
      setIsOpen(true);
    },
    [],
  );

  const removeItem = useCallback((sku: string) => {
    setLines((prev) => prev.filter((l) => l.sku !== sku));
  }, []);

  const updateQuantity = useCallback((sku: string, quantity: number) => {
    setLines((prev) =>
      prev
        .map((l) => (l.sku === sku ? { ...l, quantity } : l))
        .filter((l) => l.quantity > 0),
    );
  }, []);

  const clearCart = useCallback(() => setLines([]), []);

  const itemCount = useMemo(
    () => lines.reduce((sum, l) => sum + l.quantity, 0),
    [lines],
  );
  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + l.price * l.quantity, 0),
    [lines],
  );

  const value = useMemo(
    () => ({
      lines,
      isOpen,
      openCart,
      closeCart,
      toggleCart,
      addItem,
      addItems,
      removeItem,
      updateQuantity,
      clearCart,
      itemCount,
      subtotal,
    }),
    [
      lines,
      isOpen,
      openCart,
      closeCart,
      toggleCart,
      addItem,
      addItems,
      removeItem,
      updateQuantity,
      clearCart,
      itemCount,
      subtotal,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
