"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { ChevronDownIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { pageCopy } from "@/data/copy";

type Item = { label: string; href: string };

type PanelImage = {
  src: string;
  alt: string;
  href: string;
  cta?: string;
};

type NavDropdownProps = {
  label: string;
  columns?: { title: string; items: readonly Item[] }[];
  items?: readonly Item[];
  panelImage?: PanelImage;
  wide?: boolean;
  topLinks?: readonly Item[];
};

const triggerClass =
  "group inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-xs px-3 text-label text-paper/85 outline-none transition-colors duration-300 hover:text-white focus-visible:text-white aria-expanded:text-white xl:px-4";

const linkRowClass =
  "group/link relative z-10 flex min-h-10 cursor-pointer items-center justify-between gap-2 rounded-xs px-2 py-1.5 text-[0.9375rem] font-medium leading-snug text-ink/85 outline-none transition-colors duration-200 hover:bg-muted hover:text-ink focus-visible:bg-muted";

function chromeBottom(): number {
  const chrome = document.querySelector<HTMLElement>("[data-site-chrome]");
  if (chrome) return chrome.getBoundingClientRect().bottom;
  const header = document.querySelector<HTMLElement>("header.nav-glass");
  if (header) return header.getBoundingClientRect().bottom;
  return 108;
}

/**
 * Hover mega menu. Panel stays mounted while open (CSS show/hide only) so
 * crossing the gap to the portal does not remount and flicker.
 */
export function NavDropdown({
  label,
  columns,
  items,
  panelImage,
  wide,
  topLinks,
}: NavDropdownProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [top, setTop] = useState(108);
  const [anchorX, setAnchorX] = useState<number | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverOpenedAt = useRef(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => setMounted(true), []);

  const syncTop = useCallback(() => {
    setTop(Math.round(chromeBottom()));
    const r = triggerRef.current?.getBoundingClientRect();
    if (r) setAnchorX(Math.round(r.left + r.width / 2));
  }, []);

  const clearClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const openMenu = useCallback(() => {
    clearClose();
    syncTop();
    setOpen(true);
  }, [clearClose, syncTop]);

  const openOnHover = useCallback(() => {
    if (!open) hoverOpenedAt.current = Date.now();
    openMenu();
  }, [open, openMenu]);

  const scheduleClose = useCallback(() => {
    clearClose();
    /* Longer grace so moving from trigger → panel does not flash closed */
    closeTimer.current = setTimeout(() => setOpen(false), 220);
  }, [clearClose]);

  const closeNow = useCallback(() => {
    clearClose();
    setOpen(false);
  }, [clearClose]);

  /** Close and hand focus back to the trigger (keyboard paths). */
  const closeToTrigger = useCallback(() => {
    closeNow();
    triggerRef.current?.focus();
  }, [closeNow]);

  const panelFocusables = () =>
    Array.from(panelRef.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])") ?? []);

  // The panel is portaled to <body>, so keep Tab order sane by hand:
  // Tab past the last link or Shift+Tab before the first returns to the trigger.
  const onPanelKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab") return;
    const items = panelFocusables();
    if (!items.length) return;
    const first = items[0]!;
    const last = items[items.length - 1]!;
    if ((!e.shiftKey && document.activeElement === last) || (e.shiftKey && document.activeElement === first)) {
      e.preventDefault();
      closeToTrigger();
    }
  };

  useEffect(() => {
    if (!open) return;
    syncTop();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (panelRef.current?.contains(document.activeElement)) closeToTrigger();
      else closeNow();
    };
    window.addEventListener("resize", syncTop);
    window.addEventListener("scroll", syncTop, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", syncTop);
      window.removeEventListener("scroll", syncTop);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, syncTop, closeNow, closeToTrigger]);

  let body: ReactNode = null;

  if (wide && columns) {
    body = (
      <div className="mx-auto w-full max-w-[80rem] overflow-hidden rounded-b-xl border border-t-0 border-hairline bg-paper text-ink shadow-[0_24px_48px_rgba(0,0,0,0.24)]">
        <div className="flex flex-col gap-3 border-b border-hairline bg-[#FAF8F4] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-w-0">
            <p className="text-body-sm text-ink/75">
              {pageCopy.shopMegaHint}
            </p>
          </div>
          {topLinks?.length ? (
            <div className="flex flex-wrap items-center gap-2">
              {topLinks.map((link, i) => (
                <Button
                  key={link.href}
                  href={link.href}
                  variant={i === 0 ? "primary" : "secondary"}
                  size="sm"
                  className="w-auto max-w-none"
                  onClick={closeNow}
                >
                  {link.label}
                </Button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_13.5rem] xl:grid-cols-[minmax(0,1fr)_14.5rem]">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {columns.map((col) => (
              <nav
                key={col.title}
                aria-label={col.title}
                className="border-b border-r border-hairline px-5 py-5 xl:border-b-0 xl:last:border-r-0"
              >
                <p className="mb-3 px-2 text-eyebrow text-taupe">
                  {col.title}
                </p>
                <ul className="flex flex-col">
                  {col.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={linkRowClass}
                        onClick={closeNow}
                      >
                        <span>{item.label}</span>
                        <span
                          aria-hidden
                          className="text-xs text-ink/0 transition-colors duration-200 group-hover/link:text-ink/35"
                        >
                          →
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          {panelImage ? (
            <div className="relative min-h-[11rem] overflow-hidden border-t border-hairline lg:min-h-0 lg:border-l lg:border-t-0">
              <Link
                href={panelImage.href}
                onClick={closeNow}
                className="group/panel relative block h-full min-h-[11rem] cursor-pointer overflow-hidden outline-none lg:absolute lg:inset-0 lg:min-h-full"
              >
                <span className="absolute inset-0 overflow-hidden">
                  <Image
                    src={panelImage.src}
                    alt={panelImage.alt}
                    fill
                    loading="lazy"
                    quality={80}
                    sizes="240px"
                    className="object-cover transition-transform duration-500 ease-out group-hover/panel:scale-[1.04]"
                  />
                </span>
                <span
                  className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"
                  aria-hidden
                />
                <span className="absolute inset-x-0 bottom-0 p-4">
                  <span className="block text-eyebrow text-paper/75">
                    Not sure yet?
                  </span>
                  <span className="mt-1 block text-sm font-semibold text-paper">
                    {panelImage.cta ?? "Shop the collection →"}
                  </span>
                </span>
              </Link>
            </div>
          ) : null}
        </div>

      </div>
    );
  } else if (items) {
    body = (
      <div className="w-[17rem] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-b-xl border border-t-0 border-hairline bg-paper p-2 text-ink shadow-[0_16px_40px_rgba(0,0,0,0.2)]">
        <ul className="flex flex-col">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={linkRowClass}
                onClick={closeNow}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={openOnHover}
      onMouseLeave={scheduleClose}
    >
      <button
        ref={triggerRef}
        type="button"
        className={triggerClass}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={(e) => {
          // A click right after hover-open is the same intent: keep it open.
          if (open && Date.now() - hoverOpenedAt.current < 600) return;
          if (open) return closeNow();
          openMenu();
          // Keyboard activation (Enter/Space reports detail 0): move into the panel.
          if (e.detail === 0) requestAnimationFrame(() => panelFocusables()[0]?.focus());
        }}
      >
        {label}
        <ChevronDownIcon
          size={15}
          color="currentColor"
          className={cn(
            "opacity-60 transition-transform duration-300 ease-out",
            open && "rotate-180",
          )}
        />
      </button>

      {mounted && body
        ? createPortal(
            <div
              ref={panelRef}
              id={panelId}
              role="region"
              aria-label={label}
              aria-hidden={!open}
              className={cn(
                "fixed z-60 transition-[opacity,translate] duration-200 ease-out motion-reduce:transition-none",
                // Wide panels span the page; small ones sit centred under their trigger.
                wide ? "inset-x-0 px-3 sm:px-5 lg:px-6" : "-translate-x-1/2",
                open
                  ? "pointer-events-auto visible translate-y-0 opacity-100"
                  : "pointer-events-none invisible -translate-y-1 opacity-0",
              )}
              style={wide || anchorX === null ? { top } : { top, left: anchorX }}
              onMouseEnter={openMenu}
              onMouseLeave={scheduleClose}
              onKeyDown={onPanelKeyDown}
            >
              {/* Invisible bridge so the cursor can cross from nav into the panel */}
              <div className="absolute inset-x-0 -top-3 h-3" aria-hidden />
              {body}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
