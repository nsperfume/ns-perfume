"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { siteConfig } from "@/data/site";

const utilityLinks = [
  { label: "Journal", href: "/journal" },
  { label: "Contact", href: "/contact" },
] as const;

export function AnnouncementBar() {
  const [text, setText] = useState(siteConfig.announcement);
  const [messageEnabled, setMessageEnabled] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings")
      .then((r) => r.json())
      .then((j) => {
        if (cancelled || !j.ok || !j.data) return;
        if (typeof j.data.topbarText === "string") {
          setText(j.data.topbarText.trim());
        }
        if (typeof j.data.topbarEnabled === "boolean") {
          setMessageEnabled(j.data.topbarEnabled);
        }
      })
      .catch(() => {
        /* keep defaults from siteConfig */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const showMessage = messageEnabled && Boolean(text);
  /** Prefer the shipping clause on narrow screens so the bar stays readable. */
  const mobileText = text.includes("·")
    ? text.split("·")[0]!.trim()
    : text;

  return (
    <div className="bg-brass text-ink">
      {/* Mobile: shipping line only. Utility links live in the menu. */}
      <div className="container-ns flex h-9 items-center justify-center sm:hidden">
        <p
          className={
            showMessage
              ? "min-w-0 truncate text-center font-serif text-[11px] font-semibold uppercase tracking-[0.08em] text-ink/90"
              : "min-w-0 truncate text-center font-serif text-[11px] opacity-0"
          }
          aria-hidden={!showMessage}
        >
          {mobileText || "\u00a0"}
        </p>
      </div>

      <div className="container-ns hidden h-10 grid-cols-[auto_1fr_auto] items-center gap-4 sm:grid">
        <nav
          className="flex items-center gap-4"
          aria-label="Utility"
        >
          {utilityLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="cursor-pointer font-serif text-[13px] font-semibold uppercase tracking-[0.12em] text-ink/90 transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <p
          className={
            showMessage
              ? "min-w-0 truncate text-center font-serif text-[13px] font-semibold uppercase tracking-[0.12em] text-ink/90"
              : "min-w-0 truncate text-center font-serif text-[13px] opacity-0"
          }
          aria-hidden={!showMessage}
        >
          {text || "\u00a0"}
        </p>

        <span className="block w-[6.5rem]" aria-hidden />
      </div>
    </div>
  );
}
