"use client";

import type { ReactNode } from "react";
import { FieldHint } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";

/** Admin form card with a clear section heading. */
export function AdminFormSection({
  title,
  description,
  tip,
  children,
  className,
  id,
}: {
  /** @deprecated Numbers removed. Kept for call-site back-compat. */
  step?: number;
  title: string;
  description?: string;
  tip?: string;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-6 rounded-lg border border-[var(--admin-line)] bg-[var(--admin-paper)] shadow-[var(--admin-shadow)]",
        className,
      )}
    >
      <header className="border-b border-[var(--admin-line)] px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-lg font-semibold tracking-tight text-[var(--admin-ink)] sm:text-xl">
            {title}
          </h2>
          {tip ? <FieldHint content={tip} /> : null}
        </div>
        {description ? (
          <p className="mt-1 text-[15px] leading-relaxed text-[var(--admin-muted)]">
            {description}
          </p>
        ) : null}
      </header>
      <div className="space-y-5 px-5 py-5 sm:px-6">{children}</div>
    </section>
  );
}

export function AdminFieldLabel({
  children,
  tip,
  htmlFor,
  required,
}: {
  children: ReactNode;
  tip?: string;
  htmlFor?: string;
  required?: boolean;
}) {
  return (
    <div className="mb-2 flex items-center gap-1.5">
      <label
        htmlFor={htmlFor}
        className="font-display text-[13px] font-semibold text-[var(--admin-ink)]"
      >
        {children}
        {required ? (
          <span className="text-rosewood" aria-hidden>
            {" "}
            *
          </span>
        ) : null}
      </label>
      {tip ? <FieldHint content={tip} /> : null}
    </div>
  );
}

export const adminFieldClass =
  "w-full rounded-md border border-[var(--admin-input-border)] bg-[var(--admin-soft-2)] px-3.5 py-3 text-base text-[var(--admin-ink)] outline-none transition-colors placeholder:text-[var(--admin-faint)] focus:border-brass focus:ring-2 focus:ring-brass/20 disabled:cursor-not-allowed disabled:bg-[var(--admin-soft)] disabled:text-[var(--admin-muted)] disabled:opacity-100";
