"use client";

import Link from "next/link";
import { useState } from "react";
import {
  siFacebook,
  siInstagram,
  siPinterest,
  siTiktok,
  siX,
  siYoutube,
  type SimpleIcon,
} from "simple-icons";
import {
  footerColumns,
  siteConfig,
  socialLinks,
} from "@/data/site";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";

const iconMap: Record<(typeof socialLinks)[number]["slug"], SimpleIcon> = {
  instagram: siInstagram,
  facebook: siFacebook,
  pinterest: siPinterest,
  tiktok: siTiktok,
  x: siX,
  youtube: siYoutube,
};

function SocialIcon({
  icon,
  className,
}: {
  icon: SimpleIcon;
  className?: string;
}) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-5 w-5 fill-current", className)}
      aria-hidden
    >
      <path d={icon.path} />
    </svg>
  );
}

const columnOrder = [
  { key: "shop", title: "Shop" },
  { key: "collections", title: "Collections" },
  { key: "care", title: "Customer Care" },
  { key: "company", title: "Company" },
  { key: "legal", title: "Legal" },
] as const;

export function Footer() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  return (
    <footer
      id="site-footer"
      className="relative mt-10 overflow-hidden rounded-t-[2rem] bg-chrome text-paper shadow-[0_-20px_60px_rgba(0,0,0,0.08)] sm:mt-14 sm:rounded-t-[2.75rem] lg:rounded-t-[3.5rem]"
    >
      {/* soft gold hairline curve accent */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brass/70 to-transparent"
        aria-hidden
      />

      <div className="container-ns pt-12 pb-6 sm:pt-14 lg:pt-16">
        {/* Newsletter + brand intro */}
        <div
          id="newsletter"
          className="mb-12 grid gap-10 border-b border-white/10 pb-12 lg:grid-cols-12 lg:items-end lg:gap-12"
        >
          <div className="lg:col-span-5">
            <p className="font-display text-2xl tracking-tight text-paper sm:text-3xl">
              {siteConfig.name}
            </p>
            <p className="mt-3 max-w-md font-serif text-body-lg leading-relaxed text-paper/70">
              {siteConfig.description}
            </p>
            <p className="mt-4 font-serif text-caption text-paper/50">
              {siteConfig.tagline}
            </p>
            <div className="mt-6 flex flex-wrap gap-4 font-serif text-[0.95rem] text-paper/60">
              <a
                href={`mailto:${siteConfig.email}`}
                className="transition-colors hover:text-brass"
              >
                {siteConfig.email}
              </a>
              <span className="text-white/20" aria-hidden>
                ·
              </span>
              <a
                href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}
                className="transition-colors hover:text-brass"
              >
                {siteConfig.phone}
              </a>
            </div>
          </div>

          <div className="lg:col-span-6 lg:col-start-7 lg:justify-self-end lg:w-full lg:max-w-xl">
            <p className="font-display text-heading-sm text-paper">
              Stay On The List
            </p>
            <p className="mt-2 font-serif text-[1.05rem] font-medium leading-relaxed text-paper/70">
              New bottles, concentration notes, and seasonal wear tips. One
              letter when there is something worth opening. No weekly noise.
            </p>
            {done ? (
              <p className="mt-5 font-serif text-body text-brass">
                Thanks. You are on the list.
              </p>
            ) : (
              <form
                className="mt-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (email.includes("@")) setDone(true);
                }}
              >
                {/* Fixed height row so field + Button share one flush bar */}
                <div className="flex h-12 w-full overflow-hidden rounded-md border border-white/30 bg-white/10 focus-within:border-brass">
                  <Input
                    type="email"
                    name="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="!h-full !min-h-0 flex-1 rounded-none border-0 bg-transparent px-4 py-0 font-serif text-[1.05rem] leading-none text-paper shadow-none placeholder:text-paper/50 focus:border-transparent focus:bg-transparent focus:outline-none focus:ring-0"
                    aria-label="Email for newsletter"
                  />
                  <Button
                    type="submit"
                    variant="secondary"
                    className={cn(
                      "!h-full !min-h-0 !w-auto !max-w-none shrink-0 self-stretch",
                      "!rounded-none border-0 border-l border-white/25",
                      "bg-paper !ring-0 !ring-offset-0 focus-visible:!ring-0 focus-visible:!ring-offset-0",
                      "px-0 sm:!min-w-[9.5rem]",
                      "[&>span:last-child]:px-6",
                    )}
                  >
                    Subscribe
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Link columns */}
        <div className="mb-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {columnOrder.map(({ key, title }) => (
            <div key={key}>
              <p className="mb-4 font-display text-[13px] font-medium uppercase tracking-[0.14em] text-brass">
                {title}
              </p>
              <ul className="flex flex-col gap-2.5">
                {footerColumns[key].map((link) => (
                  <li key={`${key}-${link.href}-${link.label}`}>
                    <Link
                      href={link.href}
                      className="font-sans text-sm text-paper/60 transition-colors hover:text-paper"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Social + meta bar */}
        <div className="mb-10 flex flex-col gap-8 border-t border-white/10 pt-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="mb-3 font-display text-[13px] font-medium uppercase tracking-[0.14em] text-brass">
              Follow
            </p>
            <ul className="flex flex-wrap items-center gap-2">
              {socialLinks.map((item) => {
                const icon = iconMap[item.slug];
                return (
                  <li key={item.slug}>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={item.label}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-paper/70 transition-colors hover:border-brass hover:text-brass"
                    >
                      <SocialIcon icon={icon} />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-8">
            <p className="font-mono text-[11px] tracking-wide text-paper/40">
              Visa · Mastercard · Amex · PayPal
            </p>
            <p className="font-sans text-caption text-paper/45">
              © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Giant wordmark */}
      <div className="relative overflow-hidden border-t border-white/5 px-4 pb-4 pt-2 sm:pb-6">
        <p
          className="select-none text-center font-display font-bold uppercase leading-[0.85] tracking-[-0.04em] text-paper/[0.07] sm:text-paper/[0.09]"
          style={{
            fontSize: "clamp(2.75rem, 14vw, 10.5rem)",
          }}
          aria-hidden
        >
          NS PERFUME
        </p>
        <span className="sr-only">{siteConfig.name}</span>
      </div>
    </footer>
  );
}
