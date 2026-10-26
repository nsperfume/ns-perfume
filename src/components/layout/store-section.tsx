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
        "mb-8 flex flex-col gap-4 sm:mb-12 sm:flex-row sm:items-end sm:justify-between sm:gap-10",
        className,
      )}
    >
      <div className="max-w-[44rem]">
        {eyebrow ? (
          <p className="mb-3 text-eyebrow text-taupe">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-display-md text-balance text-ink">{title}</h2>
        {description ? (
          <p className="mt-4 max-w-[38rem] text-pretty text-body-lg text-taupe">
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
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-taupe">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="inline-flex items-center gap-2">
              {i > 0 ? (
                <span className="text-taupe/50" aria-hidden="true">
                  /
                </span>
              ) : null}
              {item.href && !last ? (
                <Link
                  href={item.href}
                  className="inline-flex min-h-8 cursor-pointer items-center transition-colors hover:text-ink"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-ink" aria-current={last ? "page" : undefined}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
