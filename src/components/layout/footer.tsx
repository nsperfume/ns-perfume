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
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/cn";
import { HORIZONTAL } from "@/components/brand/paths";
import { BrandIcon } from "@/components/ui/brand-icon";
import { MailIcon, PhoneIcon } from "@/components/ui/icons";
import { whatsappUrl } from "@/lib/whatsapp";

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
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // No mailing-list service yet: signups land in the care inbox via the contact endpoint.
  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError("Enter a valid email address.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value, source: "footer" }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        setError(json?.error || "Could not sign you up. Try again in a moment.");
        return;
      }
      setDone(true);
    } catch {
      setError("Network error. Try again in a moment.");
    } finally {
      setSending(false);
    }
  }

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

      <div className="container-ns pt-14 pb-8 sm:pt-16 lg:pt-20">
        {/* Newsletter + brand intro */}
        <div
          id="newsletter"
          className="mb-14 grid gap-10 border-b border-white/10 pb-14 lg:grid-cols-12 lg:items-end lg:gap-12"
        >
          <div className="lg:col-span-5">
            <Logo className="h-9 text-paper sm:h-10" />
            <p className="mt-5 max-w-[30rem] text-body-lg text-paper/75">
              {siteConfig.description}
            </p>
            <p className="mt-4 font-serif text-[1.5rem] italic leading-snug text-paper/60">
              {siteConfig.tagline}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-body-sm text-paper/70">
              <a
                href={`mailto:${siteConfig.email}`}
                className="inline-flex min-h-11 items-center gap-2 transition-colors hover:text-brass"
              >
                <MailIcon size={16} />
                {siteConfig.email}
              </a>
              <a
                href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}
                className="inline-flex min-h-11 items-center gap-2 font-mono transition-colors hover:text-brass"
              >
                <PhoneIcon size={16} />
                {siteConfig.phone}
              </a>
              <a
                href={whatsappUrl(siteConfig.phone, "Hi NS Perfume, I have a question.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 transition-colors hover:text-brass"
              >
                <BrandIcon name="whatsapp" size={16} />
                WhatsApp
              </a>
            </div>
          </div>

          <div className="lg:col-span-6 lg:col-start-7 lg:justify-self-end lg:w-full lg:max-w-xl">
            <p className="text-display-sm text-paper">
              Stay on the list
            </p>
            <p className="mt-3 text-body text-paper/70">
              New bottles, concentration notes, and seasonal wear tips. One
              letter when there is something worth opening. No weekly noise.
            </p>
            {done ? (
              <p className="mt-5 text-body text-brass">
                Thanks. You are on the list.
              </p>
            ) : (
              <form className="mt-5" onSubmit={subscribe} noValidate>
                {/* Mobile: stacked. sm+: field + Subscribe share one flush bar */}
                <div className="flex w-full flex-col overflow-hidden rounded-xs border border-white/30 bg-white/10 focus-within:border-brass sm:h-12 sm:flex-row">
                  <Input
                    type="email"
                    name="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    required
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? "newsletter-error" : undefined}
                    className="h-12! min-h-0! flex-1 rounded-none border-0 bg-transparent px-4 py-0 text-body leading-none text-paper shadow-none placeholder:text-paper/50 focus:border-transparent focus:bg-transparent focus:outline-none focus:ring-0 sm:h-full!"
                    aria-label="Email for newsletter"
                  />
                  <Button
                    type="submit"
                    variant="secondary"
                    disabled={sending}
                    className={cn(
                      "h-11! min-h-0! w-full! max-w-none! shrink-0 self-stretch sm:h-full! sm:w-auto!",
                      "rounded-none! border-0 border-t border-white/25 sm:border-t-0 sm:border-l",
                      "bg-paper ring-0! ring-offset-0! focus-visible:ring-0! focus-visible:ring-offset-0!",
                      "px-0 sm:min-w-[9.5rem]!",
                      "[&>span:last-child]:px-6",
                    )}
                  >
                    {sending ? "Sending…" : "Subscribe"}
                  </Button>
                </div>
                {error ? (
                  <p
                    id="newsletter-error"
                    role="alert"
                    className="mt-3 text-body-sm text-[#ff8a80]"
                  >
                    {error}
                  </p>
                ) : null}
              </form>
            )}
          </div>
        </div>

        {/* Link columns */}
        <div className="mb-14 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-5 lg:gap-8">
          {columnOrder.map(({ key, title }) => (
            <div key={key}>
              <p className="mb-5 text-eyebrow text-brass">
                {title}
              </p>
              <ul className="flex flex-col gap-1">
                {footerColumns[key].map((link) => (
                  <li key={`${key}-${link.href}-${link.label}`}>
                    <Link
                      href={link.href}
                      className="inline-flex min-h-9 items-center text-body-sm text-paper/70 transition-colors hover:text-paper"
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
            <p className="mb-4 text-eyebrow text-brass">
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
            <p className="text-caption text-paper/55">
              Cash on delivery · Bank transfer · JazzCash · Easypaisa
            </p>
            <p className="text-caption text-paper/55">
              © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Giant wordmark */}
      <div className="relative overflow-hidden border-t border-white/5 px-4 pb-4 pt-2 sm:pb-6">
        <svg
          viewBox={`${HORIZONTAL.rule.x + 26} 8 ${HORIZONTAL.width - HORIZONTAL.rule.x - 26} 80`}
          className="mx-auto block h-auto w-full max-w-[90rem] select-none fill-paper/[0.08] sm:fill-paper/[0.1]"
          aria-hidden="true"
          focusable="false"
        >
          <path d={HORIZONTAL.wordmark} />
        </svg>
        <span className="sr-only">{siteConfig.name}</span>
      </div>
    </footer>
  );
}
