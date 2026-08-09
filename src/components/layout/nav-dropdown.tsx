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
import { ChevronDownIcon } from "@animateicons/react/lucide";
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
  "group inline-flex cursor-pointer items-center gap-1.5 rounded-xs px-2 py-2 font-display text-[12px] font-medium uppercase tracking-[0.12em] text-paper/85 outline-none transition-colors duration-300 hover:text-white focus-visible:text-white aria-expanded:text-white xl:text-[13px]";

const linkRowClass =
  "group/link relative z-10 flex cursor-pointer items-center justify-between gap-2 rounded-sm px-1.5 py-1.5 font-serif text-[15px] font-semibold leading-snug text-ink/90 outline-none transition-colors duration-200 hover:bg-muted hover:text-ink focus-visible:bg-muted";

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
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelId = useId();

  useEffect(() => setMounted(true), []);

  const syncTop = useCallback(() => {
    setTop(Math.round(chromeBottom()));
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

  const scheduleClose = useCallback(() => {
    clearClose();
    /* Longer grace so moving from trigger → panel does not flash closed */
    closeTimer.current = setTimeout(() => setOpen(false), 220);
  }, [clearClose]);

  const closeNow = useCallback(() => {
    clearClose();
    setOpen(false);
  }, [clearClose]);

  useEffect(() => {
    if (!open) return;
    syncTop();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeNow();
    };
    window.addEventListener("resize", syncTop);
    window.addEventListener("scroll", syncTop, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", syncTop);
      window.removeEventListener("scroll", syncTop);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, syncTop, closeNow]);

  let body: ReactNode = null;

  if (wide && columns) {
    body = (
      <div className="mx-auto w-full max-w-[80rem] overflow-hidden rounded-b-xl border border-t-0 border-hairline bg-paper text-ink shadow-[0_24px_48px_rgba(0,0,0,0.24)]">
        <div className="flex flex-col gap-2.5 border-b border-hairline bg-[#FAF8F4] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="min-w-0">
            <p className="font-display text-[11px] font-medium uppercase tracking-[0.16em] text-taupe">
              {label}
            </p>
            <p className="mt-0.5 font-serif text-[15px] font-medium text-ink/70">
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
                  className="!h-10 !min-h-10 w-auto max-w-none px-4"
                  onClick={closeNow}
                >
                  {link.label}
                </Button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_13.5rem] xl:grid-cols-[minmax(0,1fr)_14.5rem]">
          <div className="grid sm:grid-cols-2 xl:grid-cols-4">
            {columns.map((col) => (
              <nav
                key={col.title}
                aria-label={col.title}
                className="border-b border-hairline px-4 py-4 sm:border-r sm:[&:nth-child(2n)]:border-r-0 xl:border-r xl:[&:nth-child(4n)]:border-r-0"
              >
                <p className="mb-2 font-display text-[11px] font-medium uppercase tracking-[0.16em] text-taupe">
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
                          className="text-[11px] text-ink/0 transition-colors duration-200 group-hover/link:text-ink/35"
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
                <span className="absolute inset-x-0 bottom-0 p-3.5">
                  <span className="block font-display text-[10px] font-medium uppercase tracking-[0.14em] text-paper/75">
                    Featured Look
                  </span>
                  <span className="mt-1 block font-display text-[12px] font-medium tracking-[0.06em] text-paper">
                    {panelImage.cta ?? "Shop the collection →"}
                  </span>
                </span>
              </Link>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5 border-t border-hairline px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="font-serif text-[13px] font-medium tracking-wide text-taupe">
            Nationwide delivery · clear sizes
          </p>
          <Link
            href="/find-your-scent"
            onClick={closeNow}
            className="inline-flex min-h-8 cursor-pointer items-center font-display text-[12px] font-medium uppercase tracking-[0.12em] text-ink transition-colors hover:text-brass"
          >
            Find Your Scent →
          </Link>
        </div>
      </div>
    );
  } else if (items) {
    body = (
      <div className="mx-auto w-full max-w-[17rem] overflow-hidden rounded-b-xl border border-t-0 border-hairline bg-paper p-1.5 text-ink shadow-[0_16px_40px_rgba(0,0,0,0.2)]">
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
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        className={triggerClass}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => (open ? closeNow() : openMenu())}
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
              id={panelId}
              role="region"
              aria-label={label}
              aria-hidden={!open}
              className={cn(
                "fixed inset-x-0 z-[60] transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none",
                wide ? "px-3 sm:px-5 lg:px-6" : "flex justify-center px-3",
                open
                  ? "pointer-events-auto visible translate-y-0 opacity-100"
                  : "pointer-events-none invisible -translate-y-1 opacity-0",
              )}
              style={{ top }}
              onMouseEnter={openMenu}
              onMouseLeave={scheduleClose}
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
