"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { CircleCheckIcon } from "@/components/ui/icons";
import { useCustomer } from "@/context/customer";
import {
  CONTACT_MESSAGE_MAX,
  CONTACT_TOPICS,
  type ContactTopic,
  topicNeedsOrder,
} from "@/lib/contact-topics";
import { cn } from "@/lib/cn";

type Fields = {
  name: string;
  email: string;
  phone: string;
  topic: ContactTopic;
  orderNumber: string;
  message: string;
};

const EMPTY: Fields = { name: "", email: "", phone: "", topic: "order", orderNumber: "", message: "" };
const FIELD_ORDER = ["topic", "name", "email", "phone", "orderNumber", "message"] as const;

export function ContactForm() {
  const { user } = useCustomer();
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [sentMessage, setSentMessage] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);

  // Signed-in customers start with their details filled in.
  useEffect(() => {
    if (!user) return;
    setFields((f) => ({
      ...f,
      name: f.name || user.name || "",
      email: f.email || user.email || "",
      phone: f.phone || user.phone || "",
    }));
  }, [user]);

  useEffect(() => {
    if (sentMessage) doneRef.current?.focus();
  }, [sentMessage]);

  const set = <K extends keyof Fields>(key: K, value: Fields[K]) => {
    setFields((f) => ({ ...f, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  function focusFirstError(next: Record<string, string>) {
    const first = FIELD_ORDER.find((k) => next[k]);
    if (!first) return;
    formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const honeypot = new FormData(e.currentTarget).get("website");
    const payload = {
      ...fields,
      orderNumber: topicNeedsOrder(fields.topic) ? fields.orderNumber : "",
      website: typeof honeypot === "string" ? honeypot : "",
    };

    // The schema loads on first submit so the page itself stays light.
    const { contactSchema, contactFieldErrors } = await import("@/lib/validation/contact");
    const parsed = contactSchema.safeParse(payload);
    if (!parsed.success) {
      const next = contactFieldErrors(parsed.error);
      setErrors(next);
      focusFirstError(next);
      return;
    }

    setSaving(true);
    setErrors({});
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);
      if (!json?.ok) {
        const fieldErrors = (json?.details?.fieldErrors ?? {}) as Record<string, string>;
        const next = Object.keys(fieldErrors).length
          ? fieldErrors
          : { form: json?.error || "Could not send your message. Please try again." };
        setErrors(next);
        focusFirstError(next);
        return;
      }
      setSentMessage(json.data?.message || "Thanks. We will reply soon.");
    } catch {
      setErrors({ form: "Network error. Check your connection and try again." });
    } finally {
      setSaving(false);
    }
  }

  if (sentMessage) {
    return (
      <div role="status">
        <CircleCheckIcon size={32} className="text-brass-ink" />
        <h2 ref={doneRef} tabIndex={-1} className="mt-4 text-display-sm text-ink outline-none">
          Message sent
        </h2>
        <p className="mt-3 text-body-lg text-taupe">{sentMessage}</p>
        <p className="mt-2 text-body text-taupe">
          We will reply to <span className="font-semibold text-ink">{fields.email}</span>.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setFields((f) => ({ ...EMPTY, name: f.name, email: f.email, phone: f.phone }));
              setSentMessage("");
            }}
          >
            Send another
          </Button>
          <Button href="/track-order">Track an order</Button>
        </div>
      </div>
    );
  }

  const showOrder = topicNeedsOrder(fields.topic);
  const remaining = CONTACT_MESSAGE_MAX - fields.message.trim().length;

  return (
    <form ref={formRef} className="flex flex-col gap-6" onSubmit={onSubmit} noValidate>
      <div>
        <h2 className="text-display-sm text-ink">Write to us</h2>
        <p className="mt-2 text-body text-taupe">
          The clearer the detail, the faster the reply. Fields marked{" "}
          <span className="text-rosewood" aria-hidden="true">*</span>
          <span className="sr-only">with an asterisk</span> are required.
        </p>
      </div>

      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-ink/80">
          What is it about?
          <span aria-hidden="true" className="ml-0.5 text-rosewood">*</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {CONTACT_TOPICS.map((t) => (
            <label
              key={t.value}
              className={cn(
                "inline-flex min-h-11 cursor-pointer select-none items-center rounded-xs border px-4 text-sm font-semibold transition-colors",
                "has-focus-visible:ring-2 has-focus-visible:ring-brass/50 has-focus-visible:ring-offset-2",
                fields.topic === t.value
                  ? "border-ink bg-ink text-paper"
                  : "border-[#d6cfbf] bg-paper text-ink hover:border-ink/50",
              )}
            >
              <input
                type="radio"
                name="topic"
                value={t.value}
                checked={fields.topic === t.value}
                onChange={() => set("topic", t.value)}
                className="sr-only"
              />
              {t.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Name"
          name="name"
          value={fields.name}
          onChange={(e) => set("name", e.target.value)}
          error={errors.name}
          autoComplete="name"
          maxLength={80}
          required
        />
        <Input
          label="Email"
          type="email"
          name="email"
          value={fields.email}
          onChange={(e) => set("email", e.target.value)}
          error={errors.email}
          autoComplete="email"
          inputMode="email"
          required
        />
        <Input
          label="Phone or WhatsApp"
          type="tel"
          name="phone"
          value={fields.phone}
          onChange={(e) => set("phone", e.target.value)}
          error={errors.phone}
          hint="Optional. Add it if a call or WhatsApp suits you better."
          autoComplete="tel"
          inputMode="tel"
          placeholder="0300 1234567"
          maxLength={20}
        />
        {showOrder ? (
          <Input
            label="Order number"
            name="orderNumber"
            value={fields.orderNumber}
            onChange={(e) => set("orderNumber", e.target.value)}
            error={errors.orderNumber}
            hint="Optional. It is in your confirmation email."
            placeholder="NS-7K4Q2M"
            autoCapitalize="characters"
            maxLength={20}
          />
        ) : null}
      </div>

      <Textarea
        label="Message"
        name="message"
        value={fields.message}
        onChange={(e) => set("message", e.target.value)}
        error={errors.message}
        hint={
          <span className={cn(remaining < 0 && "text-rosewood")}>
            {remaining >= 0
              ? `${remaining.toLocaleString("en-US")} characters left`
              : `${Math.abs(remaining).toLocaleString("en-US")} characters over the limit`}
          </span>
        }
        rows={6}
        placeholder={
          showOrder
            ? "Your city and what you need help with."
            : "Tell us what you are looking for. Notes you love, occasions, budget."
        }
        required
      />

      {/* Honeypot: hidden from people and screen readers, filled by bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      {errors.form ? (
        <p role="alert" className="text-body-sm font-medium text-rosewood">
          {errors.form}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
        <Button type="submit" disabled={saving} className="w-full sm:w-auto">
          {saving ? "Sending…" : "Send message"}
        </Button>
        <p className="text-body-sm text-taupe">We reply within one business day, Monday to Friday.</p>
      </div>
    </form>
  );
}
