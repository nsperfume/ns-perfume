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
        <div className="container-ns grid gap-8 py-12 md:grid-cols-3 md:gap-10 md:py-16">
          {trustPoints.map((item) => (
            <div key={item.title} className="border-t border-[#e2d6bd] pt-6">
              <h2 className="text-heading-sm text-ink">
                {item.title}
              </h2>
              <p className="mt-2 max-w-md text-body text-taupe">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-canvas section-y">
        <div className="container-ns grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16 xl:gap-24">
          <div>
            <p className="mb-3 text-eyebrow text-taupe">
              Care
            </p>
            <h2 className="text-display-md mb-4">How to reach us</h2>
            <p className="mb-10 max-w-[32rem] text-body-lg text-taupe">
              Orders, delivery timing, and bottle questions. Use the form or
              write us directly. For live parcel status, tracking is faster than
              email.
            </p>
            <dl className="grid gap-x-10 gap-y-6 border-t border-hairline pt-8 sm:grid-cols-2">
              {(
                [
                  {
                    key: "name",
                    label: "Care contact",
                    node: (
                      <p className="mt-1 text-base font-semibold leading-8 text-ink">
                        {siteConfig.contactName}
                      </p>
                    ),
                  },
                  {
                    key: "phone",
                    label: "Phone, WhatsApp, JazzCash, Easypaisa",
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
                        className="mt-1 inline-flex min-h-8 max-w-full flex-wrap items-center gap-x-2 gap-y-1 text-base font-semibold text-ink transition-colors hover:text-brass-ink"
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
                    key: "bank",
                    label: "Bank transfer",
                    node: (
                      <div className="mt-1">
                        <TransferDetails showWallets={false} />
                      </div>
                    ),
                  },
                  {
                    key: "orders",
                    label: "Orders",
                    node: (
                      <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-1">
                        <Link
                          href="/track-order"
                          className="inline-flex min-h-10 items-center text-base font-semibold text-ink underline decoration-ink/25 underline-offset-[6px] hover:decoration-brass"
                        >
                          Track your order
                        </Link>
                        <Link
                          href="/shipping-returns"
                          className="inline-flex min-h-10 items-center text-base font-semibold text-ink underline decoration-ink/25 underline-offset-[6px] hover:decoration-brass"
                        >
                          Shipping and returns
                        </Link>
                      </div>
                    ),
                  },
                ] as const
              ).map((row) => (
                <div
                  key={row.key}
                  className={
                    row.key === "bank" || row.key === "orders"
                      ? "sm:col-span-2"
                      : undefined
                  }
                >
                  <dt className="text-eyebrow text-taupe">
                    {row.label}
                  </dt>
                  <dd>{row.node}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="self-start border border-hairline bg-paper p-6 shadow-[0_1px_0_rgba(43,36,25,0.04)] sm:p-10 xl:p-12">
            {sent ? (
              <div>
                <p className="text-eyebrow text-taupe">
                  Received
                </p>
                <h3 className="mt-3 text-display-md text-ink">
                  Message sent
                </h3>
                <p className="mt-3 text-body-lg text-taupe">
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
              <form className="flex flex-col gap-6" onSubmit={onSubmit} noValidate>
                <div>
                  <p className="text-eyebrow text-taupe">
                    Write to us
                  </p>
                  <p className="mt-2 text-body text-taupe">
                    Tell us what you need. The clearer the detail, the faster
                    the reply.
                  </p>
                </div>

                <div>
                  <p className="mb-3 text-sm font-semibold text-ink/80">
                    Topic
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {topics.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setTopic(t.value)}
                        className={cn(
                          "inline-flex min-h-11 cursor-pointer items-center rounded-xs border px-4 text-sm font-semibold transition-colors",
                          topic === t.value
                            ? "border-ink bg-ink text-paper"
                            : "border-[#d6cfbf] bg-paper text-ink hover:border-ink/50",
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
                    className="mb-2 block text-sm font-semibold text-ink/80"
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
                    className="min-h-[9rem] w-full resize-y rounded-xs border border-[#d6cfbf] bg-paper px-4 py-3 text-base text-ink outline-none transition-colors placeholder:text-[#8a8f99] hover:border-ink/40 focus:border-brass focus:ring-2 focus:ring-brass/25"
                  />
                  {errors.message ? (
                    <p className="mt-1.5 text-sm font-medium text-rosewood">
                      {errors.message}
                    </p>
                  ) : null}
                </div>
                {errors.form ? (
                  <p className="text-body-sm text-rosewood">
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
