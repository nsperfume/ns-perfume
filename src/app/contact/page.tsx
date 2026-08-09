"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHero } from "@/components/layout/page-hero";
import { pageCopy } from "@/data/copy";
import { siteImages } from "@/data/images";
import { siteConfig } from "@/data/site";
import { cn } from "@/lib/cn";
import { CopyableValue } from "@/components/ui/copyable-value";
import { TransferDetails } from "@/components/commerce/transfer-details";

const topics = [
  { value: "order", label: "Order help" },
  { value: "shipping", label: "Shipping and delivery" },
  { value: "product", label: "Notes and bottles" },
  { value: "general", label: "Something else" },
] as const;

const trustPoints = [
  {
    title: "Clear replies",
    body: "Care answers about notes, parcels, and returns in plain language. No scripted upsell.",
  },
  {
    title: "Order status first",
    body: "For delivery questions, track with your order number. Write us if something looks wrong on the map.",
  },
  {
    title: "Business hours",
    body: "Mon to Fri, 9am to 5pm PKT. Messages sent on weekends wait until the next weekday.",
  },
] as const;

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState<(typeof topics)[number]["value"]>("order");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverMessage, setServerMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Name is required.";
    if (!email.includes("@")) next.email = "Enter a valid email.";
    if (message.trim().length < 10)
      next.message = "Add a few more details so we can help.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, topic, message }),
      });
      const json = await res.json();
      if (!json.ok) {
        setErrors({ form: json.error || "Could not send message" });
        return;
      }
      setServerMessage(json.data?.message || "");
      setSent(true);
    } catch {
      setErrors({ form: "Network error. Try again in a moment." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHero
        title={pageCopy.contact.title}
        description={pageCopy.contact.description}
        image={siteImages.contact}
        alt="Calm desk still life for contacting NS Perfume care"
        objectPosition="center 45%"
      />

      <section className="border-b border-hairline bg-muted/50">
        <div className="container-ns grid gap-8 py-10 sm:grid-cols-3 sm:gap-6 md:py-12">
          {trustPoints.map((item) => (
            <div key={item.title} className="border-t border-hairline pt-5">
              <h2 className="font-display text-[1.05rem] font-medium text-ink">
                {item.title}
              </h2>
              <p className="mt-2 font-serif text-[1.02rem] leading-relaxed text-taupe">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-canvas section-y">
        <div className="container-ns grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <div>
            <p className="mb-2 font-display text-[11px] font-medium uppercase tracking-[0.16em] text-taupe">
              Care
            </p>
            <h2 className="text-display-md mb-4">How to reach us</h2>
            <p className="mb-8 max-w-md font-serif text-[1.1rem] leading-relaxed text-taupe">
              Orders, delivery timing, and bottle questions. Use the form or
              write us directly. For live parcel status, tracking is faster than
              email.
            </p>
            <dl className="space-y-5 border-t border-hairline pt-6">
              {(
                [
                  {
                    key: "name",
                    label: "Care contact",
                    node: (
                      <p className="mt-1 font-display text-[1rem] font-medium leading-8 text-ink">
                        {siteConfig.contactName}
                      </p>
                    ),
                  },
                  {
                    key: "phone",
                    label: "Phone / WhatsApp",
                    node: (
                      <div className="mt-1">
                        <CopyableValue
                          value={siteConfig.phone}
                          href={`tel:${siteConfig.phone}`}
                          label="Copy phone number"
                        />
                      </div>
                    ),
                  },
                  {
                    key: "email",
                    label: "Email",
                    node: (
                      <div className="mt-1">
                        <CopyableValue
                          value={siteConfig.email}
                          href={`mailto:${siteConfig.email}`}
                          label="Copy email"
                        />
                      </div>
                    ),
                  },
                  {
                    key: "location",
                    label: "Location",
                    node: (
                      <a
                        href={siteConfig.location.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex h-8 items-center gap-2 font-display text-[1rem] font-medium text-ink transition-colors hover:text-brass"
                      >
                        <span>{siteConfig.location.label}</span>
                        <span
                          className="text-taupe/50"
                          aria-hidden
                        >
                          ·
                        </span>
                        <span className="text-taupe">
                          {siteConfig.location.detail}
                        </span>
                      </a>
                    ),
                  },
                  {
                    key: "wallet",
                    label: "JazzCash / Easypaisa",
                    node: (
                      <div className="mt-1">
                        <CopyableValue
                          value={siteConfig.phone}
                          label="Copy wallet number"
                        />
                      </div>
                    ),
                  },
                  {
                    key: "bank",
                    label: "Bank transfer",
                    node: (
                      <div className="mt-1">
                        <TransferDetails showWallets={false} />
                      </div>
                    ),
                  },
                  {
                    key: "hours",
                    label: "Hours",
                    node: (
                      <p className="mt-1 font-display text-[1rem] font-medium leading-8 text-ink">
                        Mon to Fri, 9am to 5pm PKT
                      </p>
                    ),
                  },
                  {
                    key: "orders",
                    label: "Orders",
                    node: (
                      <div className="mt-1 flex h-8 flex-wrap items-center gap-x-4 gap-y-1">
                        <Link
                          href="/track-order"
                          className="font-display text-[1rem] font-medium text-ink underline-offset-4 hover:underline"
                        >
                          Track your order
                        </Link>
                        <Link
                          href="/shipping-returns"
                          className="font-display text-[1rem] font-medium text-ink underline-offset-4 hover:underline"
                        >
                          Shipping and returns
                        </Link>
                      </div>
                    ),
                  },
                ] as const
              ).map((row) => (
                <div key={row.key}>
                  <dt className="font-display text-[11px] font-medium uppercase tracking-[0.14em] text-taupe">
                    {row.label}
                  </dt>
                  <dd>{row.node}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="border border-hairline bg-paper p-6 shadow-[0_1px_0_rgba(43,36,25,0.04)] sm:p-8 md:p-10">
            {sent ? (
              <div>
                <p className="font-display text-[11px] font-medium uppercase tracking-[0.14em] text-taupe">
                  Received
                </p>
                <h3 className="mt-3 font-display text-[1.35rem] font-medium text-ink">
                  Message sent
                </h3>
                <p className="mt-3 font-serif text-[1.1rem] leading-relaxed text-taupe">
                  {serverMessage ||
                    "Thanks. Care usually replies within one business day on Mon to Fri."}
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setSent(false);
                      setName("");
                      setEmail("");
                      setMessage("");
                      setTopic("order");
                      setServerMessage("");
                    }}
                  >
                    Send another
                  </Button>
                  <Button href="/track-order">Track an order</Button>
                </div>
              </div>
            ) : (
              <form className="flex flex-col gap-5" onSubmit={onSubmit} noValidate>
                <div>
                  <p className="font-display text-[11px] font-medium uppercase tracking-[0.14em] text-taupe">
                    Write to us
                  </p>
                  <p className="mt-2 font-serif text-[1.05rem] text-taupe">
                    Tell us what you need. The clearer the detail, the faster
                    the reply.
                  </p>
                </div>

                <div>
                  <p className="mb-2 font-display text-[11px] font-medium uppercase tracking-[0.14em] text-taupe">
                    Topic
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {topics.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setTopic(t.value)}
                        className={cn(
                          "cursor-pointer border px-3 py-2 font-display text-[11px] font-medium uppercase tracking-[0.1em] transition-colors",
                          topic === t.value
                            ? "border-ink bg-ink text-paper"
                            : "border-hairline bg-canvas text-ink hover:border-ink/40",
                        )}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Input
                  label="Name"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={errors.name}
                />
                <Input
                  label="Email"
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={errors.email}
                />
                <div>
                  <label
                    htmlFor="contact-message"
                    className="mb-1.5 block font-display text-[11px] font-medium uppercase tracking-[0.14em] text-taupe"
                  >
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={6}
                    placeholder="Order number, city, and what you need help with…"
                    className="w-full resize-y border border-hairline bg-canvas px-3 py-2.5 font-serif text-[1rem] text-ink outline-none transition-colors focus:border-ink/40"
                  />
                  {errors.message ? (
                    <p className="mt-1.5 text-sm text-rosewood">
                      {errors.message}
                    </p>
                  ) : null}
                </div>
                {errors.form ? (
                  <p className="font-serif text-[0.95rem] text-rosewood">
                    {errors.form}
                  </p>
                ) : null}
                <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                  {saving ? "Sending…" : "Send message"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
