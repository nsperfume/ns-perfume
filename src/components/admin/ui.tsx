"use client";

import Link from "next/link";
import { ChevronsLeftIcon } from "@animateicons/react/lucide";
import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

/**
 * Admin layout primitives only.
 * Forms/actions reuse shared `@/components/ui` Button, Input, Select, Textarea.
 * Surfaces read CSS vars from `.admin-app` (light / dark).
 */

export function AdminBackLink({
  href,
  label = "Back",
}: {
  href: string;
  label?: string;
}) {
  return (
    <Link
      href={href}
      className="mb-4 inline-flex items-center gap-1.5 font-display text-sm font-medium text-[var(--admin-muted)] transition-colors hover:text-[var(--admin-ink)]"
    >
      <ChevronsLeftIcon size={16} color="currentColor" isAnimated={false} />
      {label}
    </Link>
  );
}

export function AdminPageHeader({
  title,
  description,
  action,
  backHref,
  backLabel,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="mb-6 border-b border-[var(--admin-line)] pb-5 sm:mb-8">
      {backHref ? (
        <AdminBackLink href={backHref} label={backLabel || "Back"} />
      ) : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-medium tracking-tight text-[var(--admin-ink)] sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-base leading-relaxed text-[var(--admin-muted)]">
              {description}
            </p>
          ) : null}
        </div>
        {action ? (
          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
            {action}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function AdminCard({
  children,
  className,
  title,
  action,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  action?: ReactNode;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-lg border border-[var(--admin-line)] bg-[var(--admin-paper)] shadow-[var(--admin-shadow)]",
        className,
      )}
    >
      {title ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--admin-line)] px-4 py-3.5 sm:px-5">
          <h2 className="font-display text-base font-medium text-[var(--admin-ink)] sm:text-lg">
            {title}
          </h2>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function AdminStatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const published =
    s === "active" ||
    s === "published" ||
    s === "delivered" ||
    s === "confirmed" ||
    s === "shipped";
  const draft = s === "draft" || s === "pending" || s === "hidden";
  const danger = s === "cancelled" || s === "archived" || s === "rejected";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-2.5 py-1 font-display text-[11px] font-medium uppercase tracking-[0.1em] sm:text-xs",
        published &&
          "border-[var(--admin-ink)] bg-[var(--admin-ink)] text-[var(--admin-paper)]",
        draft &&
          "border-[var(--admin-line)] bg-[var(--admin-soft)] text-[var(--admin-muted)]",
        danger && "border-rosewood/40 bg-rosewood/10 text-rosewood",
        !published &&
          !draft &&
          !danger &&
          "border-[var(--admin-line)] text-[var(--admin-muted)]",
      )}
    >
      {status === "active" ? "Published" : status}
    </span>
  );
}

export function AdminTable({
  children,
  className,
  compact,
}: {
  children: ReactNode;
  className?: string;
  /** No min-width, avoids horizontal scroll in nested cards */
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-lg border border-[var(--admin-line)] bg-[var(--admin-paper)] shadow-[var(--admin-shadow)]",
        compact && "overflow-x-visible shadow-none",
        className,
      )}
    >
      <table
        className={cn(
          "w-full text-left text-[15px]",
          !compact && "min-w-[640px]",
        )}
      >
        {children}
      </table>
    </div>
  );
}

export function AdminTh({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "border-b border-[var(--admin-line)] bg-[var(--admin-soft)] px-3 py-3.5 font-display text-xs font-medium uppercase tracking-[0.1em] text-[var(--admin-muted)] sm:px-4",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function AdminTd({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <td
      className={cn(
        "border-b border-[var(--admin-line)] px-3 py-3.5 align-middle text-[var(--admin-ink)] sm:px-4",
        className,
      )}
    >
      {children}
    </td>
  );
}

export function AdminModal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 cursor-pointer bg-black/45 backdrop-blur-[1px]"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative z-10 flex max-h-[90dvh] w-full flex-col rounded-t-lg border border-[var(--admin-line)] bg-[var(--admin-paper)] shadow-modal sm:max-h-[85dvh] sm:rounded-lg",
          wide ? "sm:max-w-2xl" : "sm:max-w-lg",
        )}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--admin-line)] px-5 py-4">
          <h2 className="font-display text-lg font-medium text-[var(--admin-ink)] sm:text-xl">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md text-xl text-[var(--admin-muted)] transition-colors hover:bg-[var(--admin-soft)] hover:text-[var(--admin-ink)]"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 text-base text-[var(--admin-ink)]">
          {children}
        </div>
      </div>
    </div>
  );
}

export function formatPkr(n: number) {
  return `Rs ${Math.round(n || 0).toLocaleString("en-PK")}`;
}
