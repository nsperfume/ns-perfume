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
        <div className="container-ns grid gap-12 lg:grid-cols-2">
          <div>
            <p className="measure mb-8 text-body text-taupe">
              Messages in this UI shell validate locally only. Server submit
              wires in later.
            </p>
            <div className="space-y-3 font-serif text-[1.05rem] text-taupe">
              <p>
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="transition-colors hover:text-ink"
                >
                  {siteConfig.email}
                </a>
              </p>
              <p>Mon to Fri, 9am to 5pm PKT</p>
              <p>Studio by appointment only</p>
            </div>
          </div>
          <div className="rounded-lg border border-hairline bg-paper p-8">
            {sent ? (
              <p className="text-body text-ink">
                Message captured locally. When backends connect, you will receive
                a confirmation email.
              </p>
            ) : (
              <form
                className="flex flex-col gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (validate()) setSent(true);
                }}
              >
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
                <label className="flex flex-col gap-2 text-caption text-taupe">
                  Message
                  <textarea
                    name="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    className="w-full rounded-xs border border-hairline bg-paper px-3 py-3 text-body text-ink outline-none focus:border-brass"
                  />
                  {errors.message ? (
                    <span className="text-rosewood">{errors.message}</span>
                  ) : null}
                </label>
                <Button type="submit">Send Message</Button>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
