"use client";

import { TriangleAlertIcon } from "@animateicons/react/lucide";
import { useCallback, useState, type ReactNode } from "react";
import type { ZodType } from "zod";
import { cn } from "@/lib/cn";

/**
 * Lightweight client validation for admin forms (zod schemas that mirror the
 * API rules). Pattern:
 *
 *   const v = useFormValidation(schema);
 *   // submit
 *   if (!v.validate(values, formRef.current)) return;
 *   // field
 *   <input name="title" aria-invalid={!!v.errors.title} onBlur={() => v.revalidate(values)} />
 *   <AdminFieldError message={v.errors.title} />
 *
 * - Errors appear on submit, then update on blur/change after the first submit.
 * - Focus moves to the first invalid field in DOM order (matched by `name`,
 *   `data-field` or `id`).
 */

export type FieldErrors = Record<string, string>;

export function zodFieldErrors(
  issues: readonly { path: readonly PropertyKey[]; message: string }[],
): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export function focusFirstError(
  keys: string[],
  root?: HTMLElement | null,
): void {
  if (typeof document === "undefined" || !keys.length) return;
  const scope: ParentNode = root ?? document;
  const candidates = Array.from(
    scope.querySelectorAll<HTMLElement>("[data-field], [name], [id]"),
  );
  const match = candidates.find((el) => {
    const k = el.dataset.field ?? el.getAttribute("name") ?? el.id;
    return k ? keys.includes(k) : false;
  });
  if (!match) return;
  const focusable = match.matches(
    "input, select, textarea, button, [tabindex], [contenteditable=true]",
  )
    ? match
    : match.querySelector<HTMLElement>(
        "input, select, textarea, button, [tabindex], [contenteditable=true]",
      );
  match.scrollIntoView({ block: "center", behavior: "smooth" });
  (focusable ?? match).focus?.({ preventScroll: true });
}

export function useFormValidation<T>(schema: ZodType<T>) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const check = useCallback(
    (values: unknown): FieldErrors => {
      const r = schema.safeParse(values);
      return r.success ? {} : zodFieldErrors(r.error.issues);
    },
    [schema],
  );

  /** Run on submit. Returns true when valid; otherwise shows errors and focuses the first one. */
  const validate = useCallback(
    (values: unknown, root?: HTMLElement | null): boolean => {
      setSubmitted(true);
      const next = check(values);
      setErrors(next);
      const keys = Object.keys(next);
      if (keys.length) {
        // Let the error state render before focusing
        requestAnimationFrame(() => focusFirstError(keys, root));
      }
      return keys.length === 0;
    },
    [check],
  );

  /** Run on blur / change. Silent until the first submit attempt. */
  const revalidate = useCallback(
    (values: unknown) => {
      if (!submitted) return;
      setErrors(check(values));
    },
    [check, submitted],
  );

  const reset = useCallback(() => {
    setErrors({});
    setSubmitted(false);
  }, []);

  return { errors, submitted, validate, revalidate, reset, setErrors };
}

/** Inline error under a field. Renders nothing without a message. */
export function AdminFieldError({
  message,
  id,
  className,
}: {
  message?: string;
  id?: string;
  className?: string;
}) {
  if (!message) return null;
  return (
    <div
      id={id}
      role="alert"
      className={cn(
        "mt-1.5 flex items-start gap-1.5 text-sm font-medium text-admin-danger",
        className,
      )}
    >
      <TriangleAlertIcon
        size={15}
        color="currentColor"
        isAnimated={false}
        className="mt-0.5 shrink-0"
      />
      <span>{message}</span>
    </div>
  );
}

/** Form-level server error (e.g. "Handle already taken") above the actions. */
export function AdminFormError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <div
      role="alert"
      className="rounded-md border border-(--admin-tone-rose-line) bg-(--admin-tone-rose-bg) px-4 py-3 text-[0.9375rem] font-medium text-(--admin-tone-rose-text)"
    >
      {children}
    </div>
  );
}
