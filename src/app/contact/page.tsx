"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHero } from "@/components/layout/page-hero";
import { pageCopy } from "@/data/copy";
import { siteImages } from "@/data/images";
import { siteConfig } from "@/data/site";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);

  function validate() {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Name is required.";
    if (!email.includes("@")) next.email = "Enter a valid email.";
    if (message.trim().length < 10)
      next.message = "Add a few more details so we can help.";
    setErrors(next);
    return Object.keys(next).length === 0;
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
      <section className="bg-canvas section-y">
        <div className="container-ns grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <div>
            <p className="mb-2 font-display text-[11px] font-medium uppercase tracking-[0.16em] text-taupe">
              Care
            </p>
            <h2 className="text-display-md mb-4">How to reach us</h2>
            <p className="mb-8 max-w-md font-serif text-[1.1rem] leading-relaxed text-taupe">
              Orders, delivery timing, and bottle questions. Use the form or
              write us directly.
            </p>
            <dl className="space-y-5 border-t border-hairline pt-6">
              <div>
                <dt className="font-display text-[11px] font-medium uppercase tracking-[0.14em] text-taupe">
                  Email
                </dt>
                <dd className="mt-1">
                  <a
                    href={`mailto:${siteConfig.email}`}
                    className="font-serif text-[1.1rem] text-ink transition-colors hover:text-brass"
                  >
                    {siteConfig.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="font-display text-[11px] font-medium uppercase tracking-[0.14em] text-taupe">
                  Hours
                </dt>
                <dd className="mt-1 font-serif text-[1.1rem] text-ink/80">
                  Mon to Fri, 9am to 5pm PKT
                </dd>
              </div>
              <div>
                <dt className="font-display text-[11px] font-medium uppercase tracking-[0.14em] text-taupe">
                  Studio
                </dt>
                <dd className="mt-1 font-serif text-[1.1rem] text-ink/80">
                  By appointment only
                </dd>
              </div>
              <div>
                <dt className="font-display text-[11px] font-medium uppercase tracking-[0.14em] text-taupe">
                  Orders
                </dt>
                <dd className="mt-1">
                  <a
                    href="/track-order"
                    className="font-serif text-[1.1rem] text-ink underline-offset-4 hover:underline"
                  >
                    Track your order
                  </a>
                </dd>
              </div>
            </dl>
          </div>

          <div className="border border-hairline bg-paper p-6 sm:p-8 md:p-10">
            {sent ? (
              <div>
                <p className="font-display text-[11px] font-medium uppercase tracking-[0.14em] text-taupe">
                  Received
                </p>
                <p className="mt-3 font-serif text-[1.15rem] leading-relaxed text-ink">
                  Message captured locally for this demo. When email connect
                  lands, you will get a confirmation.
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  className="mt-6"
                  onClick={() => {
                    setSent(false);
                    setName("");
                    setEmail("");
                    setMessage("");
                  }}
                >
                  Send another
                </Button>
              </div>
            ) : (
              <form
                className="flex flex-col gap-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (validate()) setSent(true);
                }}
              >
                <p className="font-display text-[11px] font-medium uppercase tracking-[0.14em] text-taupe">
                  Write to us
                </p>
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
                    rows={5}
                    className="w-full resize-y border border-hairline bg-canvas px-3 py-2.5 font-serif text-[1rem] text-ink outline-none focus:border-ink/40"
                  />
                  {errors.message ? (
                    <p className="mt-1.5 text-sm text-rosewood">{errors.message}</p>
                  ) : null}
                </div>
                <Button type="submit" className="w-full sm:w-auto">
                  Send message
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
