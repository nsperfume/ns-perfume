"use client";

import Link from "next/link";
import {
  ChevronsLeftIcon,
  CopyIcon,
  DownloadIcon,
  ExternalLinkIcon,
  EyeIcon,
  EyeOffIcon,
  ImageIcon,
  MailIcon,
  PencilIcon,
  PhoneIcon,
  ReplyIcon,
  SearchIcon,
  SendIcon,
  Trash2Icon,
  UploadIcon,
  UserMinusIcon,
  XIcon,
} from "@animateicons/react/lucide";
import { siWhatsapp } from "simple-icons";
import { useRouter } from "next/navigation";
import { useEffect, type MouseEvent, type ReactNode } from "react";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";

/**
 * Admin layout primitives only.
 * Forms/actions use the admin wrappers in `./button`, `./input`, `./select`
 * (shared `@/components/ui` controls sized for data UI).
 * Surfaces read CSS vars from `.admin-app` (light / dark).
 *
 * Type scale (Manrope): page title 26–32px/600, card title 16–17px/600,
 * body + table cells 15px, secondary lines 13px, labels/table heads 12px+.
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
      className="-ml-1.5 mb-3 inline-flex min-h-9 items-center gap-1.5 rounded-md px-1.5 text-sm font-semibold text-admin-muted transition-colors hover:bg-admin-soft hover:text-admin-ink"
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
    <div className="mb-6 border-b border-admin-line pb-5 sm:mb-8 sm:pb-6">
      {backHref ? (
        <AdminBackLink href={backHref} label={backLabel || "Back"} />
      ) : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[1.625rem] font-semibold leading-[1.15] tracking-[-0.015em] text-admin-ink sm:text-[1.875rem] 2xl:text-[2rem]">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-3xl text-[0.9375rem] leading-relaxed text-admin-muted sm:text-base">
              {description}
            </p>
          ) : null}
        </div>
        {action ? (
          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:shrink-0 sm:justify-end">
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
        "overflow-hidden rounded-lg border border-admin-line bg-admin-paper shadow-admin",
        className,
      )}
    >
      {title ? (
        <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 border-b border-admin-line px-5 py-3 sm:px-6">
          <h2 className="text-base font-semibold text-admin-ink sm:text-[1.0625rem]">
            {title}
          </h2>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export type AdminTone = "brass" | "ink" | "amber" | "rose" | "neutral";

const TONE_CLASS: Record<AdminTone, string> = {
  brass:
    "border-(--admin-tone-brass-line) bg-(--admin-tone-brass-bg) text-(--admin-tone-brass-text)",
  ink: "border-(--admin-tone-ink-line) bg-(--admin-tone-ink-bg) text-(--admin-tone-ink-text)",
  amber:
    "border-(--admin-tone-amber-line) bg-(--admin-tone-amber-bg) text-(--admin-tone-amber-text)",
  rose: "border-(--admin-tone-rose-line) bg-(--admin-tone-rose-bg) text-(--admin-tone-rose-text)",
  neutral: "border-admin-line bg-admin-soft text-admin-muted",
};

type BadgeIcon = "check" | "clock" | "truck" | "x" | "eye-off" | "dot";

/** Plain-language labels for stored status values. */
const STATUS_LABEL: Record<string, string> = {
  active: "Published",
  pending: "Pending",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  draft: "Draft",
  hidden: "Hidden",
  new: "New",
  read: "Read",
  closed: "Closed",
  sent: "Sent",
  failed: "Failed",
  skipped: "Not sent",
  subscribed: "Subscribed",
  unsubscribed: "Unsubscribed",
  archived: "Archived",
  rejected: "Rejected",
  approved: "Approved",
  published: "Published",
};

function statusLook(s: string): { tone: AdminTone; icon: BadgeIcon } {
  if (["delivered", "sent", "subscribed", "approved"].includes(s))
    return { tone: "brass", icon: "check" };
  if (["active", "published", "registered"].includes(s)) return { tone: "brass", icon: "dot" };
  if (s === "shipped") return { tone: "ink", icon: "truck" };
  if (["confirmed", "processing"].includes(s)) return { tone: "ink", icon: "check" };
  if (["pending", "new"].includes(s)) return { tone: "amber", icon: "clock" };
  if (["cancelled", "rejected", "failed", "archived", "unsubscribed"].includes(s))
    return { tone: "rose", icon: "x" };
  if (["hidden", "draft"].includes(s)) return { tone: "neutral", icon: "eye-off" };
  return { tone: "neutral", icon: "dot" };
}

function BadgeGlyph({ icon }: { icon: BadgeIcon }) {
  if (icon === "dot")
    return <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" aria-hidden />;
  const paths: Record<Exclude<BadgeIcon, "dot">, ReactNode> = {
    check: <path d="M3.5 8.5l3 3 6-7" />,
    clock: (
      <>
        <circle cx="8" cy="8" r="5.5" />
        <path d="M8 5v3.2l2 1.3" />
      </>
    ),
    truck: (
      <>
        <path d="M1.5 4.5h7.5v6h-7.5z" />
        <path d="M9 7h3l2 2v1.5h-5" />
        <circle cx="4.5" cy="11.5" r="1.2" />
        <circle cx="11.5" cy="11.5" r="1.2" />
      </>
    ),
    x: <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />,
    "eye-off": (
      <>
        <path d="M2 8s2.2-4 6-4 6 4 6 4-2.2 4-6 4-6-4-6-4z" />
        <path d="M3 13L13 3" />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {paths[icon]}
    </svg>
  );
}

/** Soft tinted pill with an icon. Warm brand tones only (brass / ink / amber / rose). */
export function AdminStatusBadge({
  status,
  label,
  tone,
  className,
}: {
  status: string;
  /** Override the visible text */
  label?: string;
  tone?: AdminTone;
  className?: string;
}) {
  const key = status.toLowerCase();
  const look = statusLook(key);
  const text = label ?? STATUS_LABEL[key] ?? status;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold leading-5",
        TONE_CLASS[tone ?? look.tone],
        className,
      )}
    >
      <BadgeGlyph icon={look.icon} />
      {text.charAt(0).toUpperCase() + text.slice(1)}
    </span>
  );
}

export function AdminTable({
  children,
  className,
  compact,
  flush,
  stickyFirst = true,
}: {
  children: ReactNode;
  className?: string;
  /** No min-width, avoids horizontal scroll in nested cards */
  compact?: boolean;
  /** Sits inside an AdminCard: no own border, radius or shadow */
  flush?: boolean;
  /** Pin the first column while scrolling sideways on phones */
  stickyFirst?: boolean;
}) {
  return (
    <div
      className={cn(
        "admin-table-wrap overflow-x-auto overscroll-x-contain rounded-lg border border-admin-line bg-admin-paper shadow-admin",
        flush && "rounded-none border-0 shadow-none",
        compact && "overflow-x-visible shadow-none",
        stickyFirst && !compact && "admin-table-sticky",
        className,
      )}
    >
      <table
        className={cn(
          "w-full text-left text-[0.9375rem] leading-snug",
          !compact && "min-w-[44rem]",
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
  numeric,
}: {
  children?: ReactNode;
  className?: string;
  /** Right-aligned numeric column */
  numeric?: boolean;
}) {
  return (
    <th
      scope="col"
      className={cn(
        "h-11 whitespace-nowrap border-b border-admin-line bg-admin-soft px-4 text-xs font-semibold uppercase tracking-[0.08em] text-admin-muted first:pl-5 last:pr-5",
        numeric && "text-right",
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
  numeric,
}: {
  children?: ReactNode;
  className?: string;
  /** Money / counts: right-aligned mono tabular figures */
  numeric?: boolean;
}) {
  return (
    <td
      className={cn(
        "border-b border-admin-line px-4 py-3.5 align-middle text-admin-ink first:pl-5 last:pr-5 [tr:last-child>&]:border-b-0",
        numeric &&
          "whitespace-nowrap text-right font-mono text-[0.875rem] tabular-nums",
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
  size,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Shorthand for size="lg" */
  wide?: boolean;
  size?: "md" | "lg" | "xl";
}) {
  // Escape closes the dialog. Nested Radix layers (selects, popovers, confirm
  // dialogs) handle Escape first and mark it defaultPrevented, so skip those.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const s = size ?? (wide ? "lg" : "md");
  return (
    <div className="fixed inset-0 z-90 flex items-end justify-center sm:items-center sm:p-6">
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
          "relative z-10 flex max-h-[92dvh] w-full flex-col rounded-t-xl border border-admin-line bg-admin-paper shadow-modal sm:max-h-[86dvh] sm:rounded-lg",
          s === "md" && "sm:max-w-lg",
          s === "lg" && "sm:max-w-2xl lg:max-w-3xl",
          s === "xl" && "sm:max-w-3xl lg:max-w-5xl",
        )}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-admin-line py-3 pl-5 pr-3 sm:pl-6">
          <h2 className="min-w-0 truncate text-lg font-semibold text-admin-ink sm:text-xl">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-md text-admin-muted transition-colors hover:bg-admin-soft hover:text-admin-ink"
            aria-label="Close"
          >
            <XIcon size={20} color="currentColor" isAnimated={false} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 text-[0.9375rem] text-admin-ink sm:px-6">
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Inline status line for admin actions (save, delete, publish…).
 * `error` tone reads as an alert; dismiss is optional.
 */
export function AdminNotice({
  tone = "info",
  children,
  onDismiss,
  className,
}: {
  tone?: "info" | "error";
  children: ReactNode;
  onDismiss?: () => void;
  className?: string;
}) {
  const error = tone === "error";
  return (
    <div
      role={error ? "alert" : "status"}
      className={cn(
        "mb-4 flex items-start justify-between gap-3 rounded-md border px-4 py-3 text-[0.9375rem]",
        error
          ? "border-(--admin-tone-rose-line) bg-(--admin-tone-rose-bg) text-(--admin-tone-rose-text)"
          : "border-admin-line bg-admin-paper text-admin-ink",
        className,
      )}
    >
      <span className="min-w-0 pt-0.5">{children}</span>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="-my-1 -mr-1.5 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md opacity-70 transition-opacity hover:bg-admin-soft hover:opacity-100"
        >
          <XIcon size={16} color="currentColor" isAnimated={false} />
        </button>
      ) : null}
    </div>
  );
}

/** Empty list / no results: one line of context and a single clear action. */
export function AdminEmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-14 text-center",
        className,
      )}
    >
      <p className="text-base font-semibold text-admin-ink">{title}</p>
      {description ? (
        <p className="mt-1.5 max-w-md text-[0.9375rem] text-admin-muted">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

/** 44px search field with an icon, for list toolbars. */
export function AdminSearchInput({
  value,
  onChange,
  placeholder = "Search",
  label = "Search",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}) {
  return (
    <label className={cn("relative block min-w-0", className)}>
      <span className="sr-only">{label}</span>
      <SearchIcon
        size={18}
        color="currentColor"
        isAnimated={false}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-admin-faint"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-11 w-full rounded-md border border-admin-input-border bg-admin-paper py-2.5 pl-10 pr-3.5 text-base text-admin-ink outline-none transition-colors placeholder:text-admin-faint focus:border-brass focus:ring-2 focus:ring-brass/20"
      />
    </label>
  );
}

export type AdminChipOption = { value: string; label: string; count?: number };

/** Single-select filter chips (status tabs) for list pages. */
export function AdminFilterChips({
  value,
  onChange,
  options,
  label = "Filter",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly AdminChipOption[];
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("flex flex-wrap items-center gap-2", className)}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-full border px-3.5 text-sm font-semibold transition-colors",
              on
                ? "border-admin-ink bg-admin-ink text-admin-paper"
                : "border-admin-line bg-admin-paper text-admin-muted hover:border-admin-faint hover:text-admin-ink",
            )}
          >
            {o.label}
            {typeof o.count === "number" ? (
              <span
                className={cn(
                  "font-mono text-xs tabular-nums",
                  on ? "text-admin-paper/70" : "text-admin-faint",
                )}
              >
                {o.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Whole-row click opens the record. Clicks on links, buttons, inputs and
 * menus inside the row keep their own behaviour.
 */
export function useRowLink() {
  const router = useRouter();
  return (href: string) => ({
    onClick: (e: MouseEvent<HTMLElement>) => {
      const t = e.target as HTMLElement;
      if (t.closest("a, button, input, select, textarea, label, [role=combobox], [role=menu], [data-row-ignore]")) return;
      if (window.getSelection()?.toString()) return;
      if (e.metaKey || e.ctrlKey) {
        window.open(href, "_blank", "noopener");
        return;
      }
      router.push(href);
    },
    className: "cursor-pointer transition-colors hover:bg-admin-soft-2",
  });
}

/* ------------------------------------------------------------------ */
/* Actions: one icon set, one order, everywhere                         */
/* View (eye) → main contextual action → Edit (pencil) → Delete (trash) */
/* ------------------------------------------------------------------ */

export type AdminIconName =
  | "view"
  | "edit"
  | "delete"
  | "download"
  | "reply"
  | "email"
  | "call"
  | "whatsapp"
  | "publish"
  | "hide"
  | "external"
  | "copy"
  | "poster"
  | "send"
  | "upload"
  | "remove-user";

function BrandGlyph({ path, size }: { path: string; size: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden
      className="shrink-0"
    >
      <path d={path} />
    </svg>
  );
}

/** The single icon map for admin actions (lucide, static; brands via simple-icons). */
export function AdminIcon({
  name,
  size = 18,
  className,
}: {
  name: AdminIconName;
  size?: number;
  className?: string;
}) {
  const p = { size, color: "currentColor", isAnimated: false, className: cn("shrink-0", className) };
  switch (name) {
    case "view":
      return <EyeIcon {...p} />;
    case "edit":
      return <PencilIcon {...p} />;
    case "delete":
      return <Trash2Icon {...p} />;
    case "download":
      return <DownloadIcon {...p} />;
    case "reply":
      return <ReplyIcon {...p} />;
    case "email":
      return <MailIcon {...p} />;
    case "call":
      return <PhoneIcon {...p} />;
    case "whatsapp":
      return <BrandGlyph path={siWhatsapp.path} size={size - 1} />;
    case "publish":
      return <EyeIcon {...p} />;
    case "hide":
      return <EyeOffIcon {...p} />;
    case "external":
      return <ExternalLinkIcon {...p} />;
    case "copy":
      return <CopyIcon {...p} />;
    case "poster":
      return <ImageIcon {...p} />;
    case "send":
      return <SendIcon {...p} />;
    case "upload":
      return <UploadIcon {...p} />;
    case "remove-user":
      return <UserMinusIcon {...p} />;
  }
}

const ICON_ACTION =
  "inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-md text-admin-muted outline-none transition-colors hover:bg-admin-soft hover:text-admin-ink focus-visible:ring-2 focus-visible:ring-brass/60 focus-visible:ring-offset-1 focus-visible:ring-offset-admin-paper disabled:cursor-not-allowed disabled:opacity-40";

/**
 * 40×40 icon action with a tooltip and aria-label. Use `href` for pages
 * (Next Link), `download` for files, `external` for new tabs, or `onClick`.
 * `tone="danger"` turns rosewood on hover only.
 */
export function AdminIconAction({
  label,
  ariaLabel,
  icon,
  href,
  download,
  external,
  onClick,
  tone = "neutral",
  disabled,
  className,
}: {
  /** Tooltip text (short, e.g. "View order") */
  label: string;
  /** Screen-reader text when it should name the record (defaults to label) */
  ariaLabel?: string;
  icon: AdminIconName;
  href?: string;
  download?: boolean;
  external?: boolean;
  onClick?: () => void;
  tone?: "neutral" | "danger";
  disabled?: boolean;
  className?: string;
}) {
  const cls = cn(
    ICON_ACTION,
    tone === "danger" &&
      "hover:bg-(--admin-tone-rose-bg) hover:text-admin-danger focus-visible:ring-admin-danger/50",
    disabled && "pointer-events-none opacity-40",
    className,
  );
  const glyph = <AdminIcon name={icon} />;
  const a11y = ariaLabel ?? label;
  const native =
    href &&
    (download ||
      external ||
      /^(mailto:|tel:|https?:|\/api\/)/.test(href));
  const el = href ? (
    native ? (
      <a
        href={href}
        aria-label={a11y}
        className={cls}
        download={download || undefined}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
      >
        {glyph}
      </a>
    ) : (
      <Link href={href} aria-label={a11y} className={cls}>
        {glyph}
      </Link>
    )
  ) : (
    <button
      type="button"
      aria-label={a11y}
      className={cls}
      onClick={onClick}
      disabled={disabled}
    >
      {glyph}
    </button>
  );
  return <Tooltip content={label}>{el}</Tooltip>;
}

/** Row action group: consistent spacing, never triggers the row click. */
export function AdminRowActions({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      data-row-ignore
      className={cn("flex items-center justify-end gap-0.5", className)}
    >
      {children}
    </div>
  );
}

/** Thin divider that sets destructive actions apart from the rest. */
export function AdminActionDivider() {
  return <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-admin-line" />;
}

/**
 * wa.me number from a stored phone: digits only, leading 0 becomes 92,
 * bare 10-digit mobiles (3xx…) get 92. Numbers typed with + are kept.
 */
export function whatsappNumber(phone?: string | null): string {
  if (!phone) return "";
  const hadPlus = phone.trim().startsWith("+");
  let d = phone.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  else if (!hadPlus && d.startsWith("0")) d = `92${d.slice(1)}`;
  else if (!hadPlus && d.length === 10 && d.startsWith("3")) d = `92${d}`;
  return d.length >= 10 ? d : "";
}

export function whatsappHref(phone?: string | null, text?: string): string {
  const n = whatsappNumber(phone);
  if (!n) return "";
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

/**
 * Labelled contact buttons for detail pages: WhatsApp, Call, Email.
 * Each shows only when the phone or email exists.
 */
export function AdminContactActions({
  phone,
  email,
  whatsappText,
  emailSubject,
  className,
}: {
  phone?: string | null;
  email?: string | null;
  whatsappText?: string;
  emailSubject?: string;
  className?: string;
}) {
  const wa = whatsappHref(phone, whatsappText);
  const items: { key: string; href: string; label: string; icon: AdminIconName; external?: boolean }[] = [];
  if (wa) items.push({ key: "wa", href: wa, label: "WhatsApp", icon: "whatsapp", external: true });
  if (phone) items.push({ key: "tel", href: `tel:${phone.replace(/[^\d+]/g, "")}`, label: "Call", icon: "call" });
  if (email)
    items.push({
      key: "mail",
      href: `mailto:${email}${emailSubject ? `?subject=${encodeURIComponent(emailSubject)}` : ""}`,
      label: "Email",
      icon: "email",
    });
  if (!items.length) return null;
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {items.map((it) => (
        <a
          key={it.key}
          href={it.href}
          target={it.external ? "_blank" : undefined}
          rel={it.external ? "noopener noreferrer" : undefined}
          className="inline-flex min-h-10 items-center gap-2 rounded-md border border-admin-line bg-admin-paper px-3.5 text-sm font-semibold text-admin-ink outline-none transition-colors hover:border-admin-ink focus-visible:ring-2 focus-visible:ring-brass/60"
        >
          <AdminIcon name={it.icon} size={17} className="text-admin-muted" />
          {it.label}
        </a>
      ))}
    </div>
  );
}

/** Read `{ ok, error }` from an API response without throwing on non-JSON bodies. */
export async function readAdminJson<T = unknown>(
  res: Response,
): Promise<{ ok: boolean; data?: T; error?: string }> {
  const json = (await res.json().catch(() => null)) as {
    ok?: boolean;
    data?: T;
    error?: string;
  } | null;
  if (json && typeof json.ok === "boolean") {
    return { ok: json.ok, data: json.data, error: json.error };
  }
  return {
    ok: false,
    error: res.ok ? "Unexpected response" : `Request failed (${res.status})`,
  };
}

export function formatPkr(n: number) {
  return `Rs ${Math.round(n || 0).toLocaleString("en-PK")}`;
}
