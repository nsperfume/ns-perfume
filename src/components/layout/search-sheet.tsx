"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { SearchIcon, XIcon } from "@animateicons/react/lucide";
import { useUi } from "@/context/ui";
import type { StoreProduct } from "@/lib/mappers";
import { Price } from "@/components/commerce/price";
import { cn } from "@/lib/cn";

/** Note chips fill the search box; `href` chips jump straight to a collection. */
const QUICK_SEARCHES: { label: string; q?: string; href?: string }[] = [
  { label: "Oud", q: "oud" },
  { label: "Rose", q: "rose" },
  { label: "Vanilla", q: "vanilla" },
  { label: "Cedar", q: "cedar" },
  { label: "Citrus", q: "citrus" },
  { label: "Saffron", q: "saffron" },
  { label: "For Her", href: "/collections/for-her" },
  { label: "For Him", href: "/collections/for-him" },
];

const quickChipClass =
  "inline-flex min-h-10 cursor-pointer items-center rounded-xs border border-hairline bg-[#FAF8F4] px-4 text-body-sm text-ink transition-colors hover:border-ink hover:bg-ink hover:text-paper";

/**
 * Drops open from the bottom edge of the fixed chrome (topbar + nav).
 */
export function SearchSheet() {
  const { searchOpen, closeSearch } = useUi();
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [catalog, setCatalog] = useState<StoreProduct[]>([]);
  const titleId = useId();

  useEffect(() => {
    if (!searchOpen) return;
    let cancelled = false;
    fetch("/api/products")
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled && j.ok) setCatalog(j.data as StoreProduct[]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [searchOpen]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return catalog
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.descriptor.toLowerCase().includes(q) ||
          p.family.toLowerCase().includes(q) ||
          p.topNotes.some((n) => n.toLowerCase().includes(q)) ||
          p.heartNotes.some((n) => n.toLowerCase().includes(q)) ||
          p.baseNotes.some((n) => n.toLowerCase().includes(q)),
      )
      .slice(0, 6);
  }, [query, catalog]);

  const bestsellers = useMemo(
    () => catalog.filter((p) => p.badges.includes("bestseller")).slice(0, 4),
    [catalog],
  );

  const animateOpen = useCallback(() => {
    const root = rootRef.current;
    const panel = panelRef.current;
    if (!root || !panel) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.killTweensOf([root, panel]);

    if (reduced) {
      gsap.set(root, { autoAlpha: 1 });
      gsap.set(panel, { y: 0, autoAlpha: 1 });
      return;
    }

    gsap.set(root, { autoAlpha: 1 });
    gsap.fromTo(
      panel,
      { y: "-100%", autoAlpha: 0.95 },
      { y: "0%", autoAlpha: 1, duration: 0.4, ease: "power4.out" },
    );
    gsap.fromTo(
      root.querySelector("[data-search-scrim]"),
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: 0.3, ease: "power2.out" },
    );
  }, []);

  const animateClose = useCallback((done?: () => void) => {
    const root = rootRef.current;
    const panel = panelRef.current;
    if (!root || !panel) {
      done?.();
      return;
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.killTweensOf([root, panel]);

    if (reduced) {
      gsap.set(root, { autoAlpha: 0 });
      done?.();
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(root, { autoAlpha: 0 });
        done?.();
      },
    });
    tl.to(panel, { y: "-100%", duration: 0.28, ease: "power3.in" }, 0).to(
      root.querySelector("[data-search-scrim]"),
      { autoAlpha: 0, duration: 0.24, ease: "power2.in" },
      0,
    );
  }, []);

  useEffect(() => {
    if (searchOpen) {
      setMounted(true);
    } else if (mounted) {
      animateClose(() => {
        setMounted(false);
        setQuery("");
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to open flag
  }, [searchOpen]);

  useEffect(() => {
    if (!mounted || !searchOpen) return;
    requestAnimationFrame(() => {
      animateOpen();
      inputRef.current?.focus();
    });
  }, [mounted, searchOpen, animateOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSearch();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [searchOpen, closeSearch]);

  useEffect(() => {
    if (!mounted || !results.length) return;
    const list = rootRef.current?.querySelectorAll("[data-search-result]");
    if (!list?.length) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    gsap.fromTo(
      list,
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.22, stagger: 0.03, ease: "power2.out" },
    );
  }, [mounted, results]);

  if (!mounted) return null;

  function goFullSearch(q = query.trim()) {
    closeSearch();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  function applyQuick(q: string) {
    setQuery(q);
    inputRef.current?.focus();
  }

  const hasQuery = query.trim().length > 0;

  return (
    <div
      ref={rootRef}
      className="fixed inset-x-0 bottom-0 top-chrome-height z-40 flex flex-col opacity-0"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        data-search-scrim
        aria-label="Close search"
        className="absolute inset-0 bg-ink/45"
        onClick={closeSearch}
      />

      <div
        ref={panelRef}
        className="relative z-10 border-b border-hairline bg-paper text-ink shadow-[0_16px_40px_rgba(0,0,0,0.18)] will-change-transform"
      >
        <div className="container-ns py-4 sm:py-5">
          <h2 id={titleId} className="sr-only">
            Search products
          </h2>

          {/* Single compact search row */}
          <form
            className="flex items-stretch overflow-hidden rounded-xs border border-ink bg-paper"
            onSubmit={(e) => {
              e.preventDefault();
              goFullSearch();
            }}
          >
            <div className="flex min-w-0 flex-1 items-center gap-3 px-3 sm:px-4">
              <SearchIcon
                size={20}
                color="currentColor"
                className="shrink-0 text-taupe"
              />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search notes, names, or families"
                className="min-h-12 w-full border-0 bg-transparent font-sans text-[1.125rem] text-ink outline-none placeholder:text-taupe/65 sm:min-h-[3.25rem] sm:text-[1.25rem]"
                aria-label="Search products"
              />
            </div>
            <button
              type="submit"
              className="hidden shrink-0 cursor-pointer bg-ink px-5 text-label text-paper transition-colors hover:bg-brass hover:text-ink sm:inline-flex sm:items-center"
            >
              Search
            </button>
            <button
              type="button"
              onClick={closeSearch}
              className="inline-flex min-w-12 cursor-pointer items-center justify-center border-l border-ink/15 text-taupe transition-colors hover:bg-muted hover:text-ink"
              aria-label="Close search"
            >
              <XIcon size={18} color="currentColor" />
            </button>
          </form>

          {/* Body: suggestions or results */}
          <div className="mt-4 max-h-[min(42vh,22rem)] overflow-y-auto scrollbar-panel">
            {!hasQuery ? (
              <div className="space-y-5">
                <div>
                  <p className="mb-2.5 text-eyebrow text-taupe">
                    Try a note or collection
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_SEARCHES.map((item) =>
                      item.href ? (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={closeSearch}
                          className={quickChipClass}
                        >
                          {item.label}
                        </Link>
                      ) : (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => applyQuick(item.q ?? item.label)}
                          className={quickChipClass}
                        >
                          {item.label}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                {bestsellers.length > 0 ? (
                  <div>
                    <p className="mb-2.5 text-eyebrow text-taupe">
                      Bestsellers
                    </p>
                    <ul className="grid gap-1 sm:grid-cols-2">
                      {bestsellers.map((p) => (
                        <li key={p.handle}>
                          <Link
                            href={`/products/${p.handle}`}
                            onClick={closeSearch}
                            className="group flex items-center gap-3 rounded-xs px-2 py-2 transition-colors hover:bg-muted"
                          >
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden bg-canvas">
                              <Image
                                src={p.imagePrimary}
                                alt=""
                                fill
                                sizes="48px"
                                className="object-contain p-1"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-base font-semibold text-ink group-hover:text-brass-ink">
                                {p.name}
                              </p>
                              <Price
                                amountPkr={p.prices[0]?.price ?? 0}
                                className="text-caption text-taupe"
                              />
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-start gap-3 py-2">
                <p className="text-body text-taupe">
                  No bottles match “{query.trim()}”.
                </p>
                <button
                  type="button"
                  onClick={() => goFullSearch()}
                  className="inline-flex min-h-11 cursor-pointer items-center text-label text-ink underline decoration-ink/25 underline-offset-[6px] hover:decoration-brass"
                >
                  Open full search →
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-hairline border-t border-hairline">
                {results.map((p) => (
                  <li key={p.handle} data-search-result>
                    <Link
                      href={`/products/${p.handle}`}
                      onClick={closeSearch}
                      className="group flex items-center gap-3.5 py-3 transition-colors hover:bg-muted/80 sm:gap-4"
                    >
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden bg-canvas sm:h-16 sm:w-16">
                        <Image
                          src={p.imagePrimary}
                          alt=""
                          fill
                          sizes="64px"
                          className="object-contain p-1.5"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-2">
                          <p className="truncate text-display-sm text-ink group-hover:text-brass-ink">
                            {p.name}
                          </p>
                          <span className="text-eyebrow text-taupe">
                            {p.concentration}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-body-sm text-taupe">
                          {p.descriptor}
                        </p>
                        <Price
                          amountPkr={p.prices[0]?.price ?? 0}
                          className="mt-1 text-base sm:hidden"
                        />
                      </div>
                      <Price
                        amountPkr={p.prices[0]?.price ?? 0}
                        className="hidden shrink-0 text-base sm:block"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-hairline pt-3">
            <button
              type="button"
              onClick={() => goFullSearch()}
              className={cn(
                "inline-flex min-h-11 cursor-pointer items-center text-label text-ink underline decoration-ink/25 underline-offset-[6px] hover:decoration-brass",
              )}
            >
              {hasQuery ? "See all results →" : "Full search page →"}
            </button>
            <p className="font-mono text-xs tracking-wide text-taupe">
              Esc
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
