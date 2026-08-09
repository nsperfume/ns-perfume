"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Reset window scroll on client navigations.
 * Avoids sticky mid-page landings from smooth scroll / focused elements.
 */
export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });
    return () => window.cancelAnimationFrame(id);
  }, [pathname]);

  return null;
}
