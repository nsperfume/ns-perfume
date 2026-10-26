"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Reset window scroll on forward client navigations.
 * Avoids sticky mid-page landings from smooth scroll / focused elements.
 * Skips hash links (/faq#concentration) so the target section stays in view, and
 * Back / Forward so the browser and router can restore the previous position.
 */
export function ScrollToTop() {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);
  /** Path the last Back / Forward landed on. */
  const historyPath = useRef<string | null>(null);

  useEffect(() => {
    const onPopState = () => {
      historyPath.current = window.location.pathname;
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    // First paint, or a re-run with the same path: leave the browser's position alone.
    if (prevPathname.current === pathname) return;
    prevPathname.current = pathname;

    const fromHistory = historyPath.current === pathname;
    historyPath.current = null;
    if (fromHistory || window.location.hash) return;

    const id = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
    return () => window.cancelAnimationFrame(id);
  }, [pathname]);

  return null;
}
