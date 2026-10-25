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
          // Admin copy sometimes ends with a stray separator; trim it.
          setText(j.data.topbarText.trim().replace(/[\s·|,-]+$/, ""));
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
              ? "min-w-0 truncate text-center text-eyebrow text-ink/90"
              : "min-w-0 truncate text-center text-xs opacity-0"
          }
          aria-hidden={!showMessage}
        >
          {mobileText || "\u00a0"}
        </p>
      </div>

      <div className="container-ns hidden h-10 grid-cols-[1fr_minmax(0,auto)_1fr] items-center gap-6 sm:grid">
        <nav
          className="flex items-center gap-5"
          aria-label="Utility"
        >
          {utilityLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex min-h-10 cursor-pointer items-center text-label text-ink/90 underline-offset-4 transition-colors hover:text-ink hover:underline"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <p
          className={
            showMessage
              ? "min-w-0 truncate text-center text-label text-ink/90"
              : "min-w-0 truncate text-center text-caption opacity-0"
          }
          aria-hidden={!showMessage}
        >
          {text || "\u00a0"}
        </p>

        <span aria-hidden />
      </div>
    </div>
  );
}
