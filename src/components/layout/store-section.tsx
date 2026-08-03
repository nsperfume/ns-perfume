import Link from "next/link";
import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

/** Consistent section header for storefront listings and PDP bands. */
export function StoreSectionHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="mb-2 font-display text-[11px] font-medium uppercase tracking-[0.16em] text-taupe">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-display-md text-balance text-ink">{title}</h2>
        {description ? (
          <p className="mt-2 max-w-xl text-pretty font-serif text-[1.05rem] leading-relaxed text-taupe">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function StoreBreadcrumb({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-8 flex flex-wrap items-center gap-x-2 gap-y-1 font-display text-[11px] uppercase tracking-[0.12em] text-taupe"
    >
      {items.map((item, i) => (
        <span key={`${item.label}-${i}`} className="inline-flex items-center gap-2">
          {i > 0 ? (
            <span className="text-hairline" aria-hidden>
              /
            </span>
          ) : null}
          {item.href ? (
            <Link
              href={item.href}
              className="cursor-pointer transition-colors hover:text-ink"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-ink">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
