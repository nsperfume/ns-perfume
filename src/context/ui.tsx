"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ToastKind = "cart" | "wishlist" | "info";

export type ToastItem = {
  id: string;
  message: string;
  kind: ToastKind;
};

type UiContextValue = {
  searchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;
  toasts: ToastItem[];
  showToast: (message: string, kind?: ToastKind) => void;
  dismissToast: (id: string) => void;
};

const UiContext = createContext<UiContextValue | null>(null);

export function UiProvider({ children }: { children: ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const toggleSearch = useCallback(() => setSearchOpen((v) => !v), []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, kind: ToastKind = "info") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-2), { id, message, kind }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 2600);
    },
    [],
  );

  const value = useMemo(
    () => ({
      searchOpen,
      openSearch,
      closeSearch,
      toggleSearch,
      toasts,
      showToast,
      dismissToast,
    }),
    [
      searchOpen,
      openSearch,
      closeSearch,
      toggleSearch,
      toasts,
      showToast,
      dismissToast,
    ],
  );

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi() {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error("useUi must be used within UiProvider");
  return ctx;
}
