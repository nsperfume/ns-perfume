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

  return (
    <div className="bg-brass text-ink">
      <div className="container-ns grid h-9 grid-cols-[auto_1fr_auto] items-center gap-3 sm:h-10 sm:gap-4">
        <nav
          className="flex items-center gap-3 sm:gap-4"
          aria-label="Utility"
        >
          {utilityLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-serif text-[12px] font-semibold uppercase tracking-[0.12em] text-ink/90 transition-colors hover:text-ink cursor-pointer sm:text-[13px]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Always render the same child type to keep markup stable */}
        <p
          className={
            showMessage
              ? "min-w-0 truncate text-center font-serif text-[12px] font-semibold uppercase tracking-[0.1em] text-ink/90 sm:text-[13px] sm:tracking-[0.12em]"
              : "min-w-0 truncate text-center font-serif text-[12px] opacity-0 sm:text-[13px]"
          }
          aria-hidden={!showMessage}
        >
          {text || "\u00a0"}
        </p>

        <span
          className="hidden w-[5.5rem] sm:block sm:w-[6.5rem]"
          aria-hidden
        />
      </div>
    </div>
  );
}
