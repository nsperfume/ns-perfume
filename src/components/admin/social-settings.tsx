"use client";

import { useEffect, useRef, useState } from "react";
import { AdminCard, readAdminJson } from "@/components/admin/ui";
import { Button } from "@/components/admin/button";
import { AdminFieldLabel, adminFieldClass } from "@/components/admin/form-section";
import {
  AdminFieldError,
  AdminFormError,
  focusFirstError,
} from "@/components/admin/form-validation";
import { toast } from "@/components/admin/toast";
import { SocialIcon } from "@/components/ui/social-icon";
import { cn } from "@/lib/cn";
import {
  SOCIAL_PLATFORMS,
  parseSocialForm,
  type SocialKey,
  type SocialLink,
} from "@/lib/social";

type SocialForm = Record<SocialKey, string>;

function toForm(links: SocialLink[]): SocialForm {
  const form = Object.fromEntries(SOCIAL_PLATFORMS.map((p) => [p.key, ""])) as SocialForm;
  for (const link of links) form[link.key] = link.href;
  return form;
}

/** Links the owner fills in here show as icons in the footer and in emails; empty ones stay hidden. */
export function SocialSettings({
  initial,
  onDirtyChange,
}: {
  /** Stored links from GET /api/admin/settings (null while loading). */
  initial: SocialLink[] | null;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [baseline, setBaseline] = useState<SocialForm>(() => toForm([]));
  const [form, setForm] = useState<SocialForm>(() => toForm([]));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!initial) return;
    const next = toForm(initial);
    setBaseline(next);
    setForm(next);
  }, [initial]);

  const dirty = JSON.stringify(form) !== JSON.stringify(baseline);
  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");
    const checked = parseSocialForm(form);
    setErrors(checked.errors);
    const keys = Object.keys(checked.errors);
    if (keys.length) {
      toast.error("Check the highlighted links");
      requestAnimationFrame(() => focusFirstError(keys, formRef.current));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ social: form }),
      });
      const raw = (await res.clone().json().catch(() => null)) as {
        details?: { fieldErrors?: Record<string, string> };
      } | null;
      const j = await readAdminJson<{ social: SocialLink[] }>(res);
      if (!j.ok || !j.data) {
        const message = j.error || "Could not save the social links";
        setErrors(raw?.details?.fieldErrors ?? {});
        setServerError(message);
        toast.error(message);
        return;
      }
      const next = toForm(j.data.social);
      setForm(next);
      setBaseline(next);
      toast.success("Social links saved");
    } catch {
      setServerError("Network error. The social links were not saved.");
      toast.error("Network error. The social links were not saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminCard title="Social media">
      <form ref={formRef} className="space-y-5 px-5 py-5 sm:px-6" onSubmit={save} noValidate>
        <p className="text-[0.9375rem] text-admin-muted">
          Paste the full link to each page you have. Filled links show as icons in the site footer
          and in emails. Leave a box empty to hide that icon.
        </p>
        <div className="grid gap-5 md:grid-cols-2">
          {SOCIAL_PLATFORMS.map(({ key, label, example }) => {
            const message = errors[`social.${key}`];
            return (
              <div key={key} data-field={`social.${key}`} className="min-w-0">
                <AdminFieldLabel htmlFor={`social-${key}`}>
                  <span className="inline-flex items-center gap-2">
                    <SocialIcon platform={key} className="h-4 w-4 text-admin-muted" />
                    {label}
                  </span>
                </AdminFieldLabel>
                <input
                  id={`social-${key}`}
                  name={`social.${key}`}
                  type="url"
                  inputMode="url"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={form[key]}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, [key]: e.target.value }));
                    if (message) setErrors((all) => ({ ...all, [`social.${key}`]: "" }));
                  }}
                  placeholder={example}
                  aria-invalid={message ? true : undefined}
                  className={cn(adminFieldClass, message && "border-admin-danger")}
                />
                <AdminFieldError message={message} />
              </div>
            );
          })}
        </div>
        <AdminFormError>{serverError}</AdminFormError>
        <div className="flex justify-end">
          <Button type="submit" disabled={saving || !dirty} className="sm:w-auto">
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>
    </AdminCard>
  );
}
