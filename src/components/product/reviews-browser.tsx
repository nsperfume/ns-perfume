"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ui/star-rating";
import { CircleCheckIcon, ShieldCheckIcon } from "@/components/ui/icons";
import { ReviewComposer } from "@/components/product/review-composer";
import { cn } from "@/lib/cn";

export type ReviewItem = {
  id: string;
  rating: number;
  title: string;
  body: string;
  author: string;
  city: string;
  verified: boolean;
  /** ISO timestamp for <time>. */
  date: string;
  /** Pre-formatted on the server so both renders match. */
  dateLabel: string;
};

const PAGE = 4;
const STAR_WORD = ["", "one", "two", "three", "four", "five"];
const STAR_PATH =
  "m12 2.5 2.9 5.88 6.49.94-4.7 4.58 1.11 6.47L12 17.27l-5.8 3.1 1.11-6.47-4.7-4.58 6.49-.94L12 2.5z";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

function initials(name: string) {
  return name
    .replace(/[^\p{L}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export function ReviewsBrowser({
  productHandle,
  productName,
  average,
  count,
  reviews,
}: {
  productHandle: string;
  productName: string;
  average: number;
  count: number;
  reviews: ReviewItem[];
}) {
  const [stars, setStars] = useState<number | null>(null);
  const [shown, setShown] = useState(PAGE);

  const distribution = useMemo(
    () => [5, 4, 3, 2, 1].map((s) => ({ s, n: reviews.filter((r) => r.rating === s).length })),
    [reviews],
  );
  const verified = reviews.filter((r) => r.verified).length;
  const filtered = stars ? reviews.filter((r) => r.rating === stars) : reviews;
  const visible = filtered.slice(0, shown);

  const filterBy = (s: number | null) => {
    setStars(s);
    setShown(PAGE);
  };

  if (!reviews.length) {
    return (
      <div className="mt-8 flex flex-col items-start gap-5 border border-hairline bg-muted/40 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="max-w-xl">
          <p className="text-heading-sm text-ink">No reviews yet</p>
          <p className="mt-1.5 text-body text-taupe">
            Worn {productName}? Share how it opens, how long it lasts and where
            you wore it. Reviews appear after a quick check.
          </p>
        </div>
        <ReviewComposer productHandle={productHandle} productName={productName} />
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-10 lg:mt-12 lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] lg:gap-16 xl:gap-24">
      <aside className="lg:sticky lg:top-[calc(var(--spacing-chrome-height)+2rem)] lg:self-start">
        <div className="flex items-end gap-4">
          <span className="font-display text-[3.75rem] font-medium leading-[0.85] text-ink lining-nums">
            {average.toFixed(1)}
          </span>
          <div>
            <StarRating rating={average} size="md" />
            <p className="mt-1 text-caption text-taupe">Based on {plural(count, "review")}</p>
          </div>
        </div>

        <ul className="mt-6 space-y-0.5" aria-label="Filter reviews by rating">
          {distribution.map(({ s, n }) => {
            const pct = reviews.length ? Math.round((n / reviews.length) * 100) : 0;
            const active = stars === s;
            return (
              <li key={s}>
                <button
                  type="button"
                  disabled={!n}
                  aria-pressed={active}
                  aria-label={`Show ${STAR_WORD[s]} star reviews (${n})`}
                  onClick={() => filterBy(active ? null : s)}
                  className={cn(
                    "grid w-full grid-cols-[2.25rem_minmax(0,1fr)_1.75rem] items-center gap-3 rounded-xs px-2 py-1.5 text-left text-body-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brass/50",
                    n ? "cursor-pointer hover:bg-muted/70" : "cursor-default opacity-45",
                    active && "bg-muted",
                  )}
                >
                  <span className="inline-flex items-center gap-1 font-semibold text-ink">
                    {s}
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-brass" aria-hidden="true">
                      <path fill="currentColor" d={STAR_PATH} />
                    </svg>
                  </span>
                  <span className="h-1.5 overflow-hidden rounded-full bg-hairline">
                    <span className="block h-full rounded-full bg-brass" style={{ width: `${pct}%` }} />
                  </span>
                  <span className="text-right tabular-nums text-taupe">{n}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {verified ? (
          <p className="mt-5 flex items-center gap-2 text-body-sm text-taupe">
            <ShieldCheckIcon size={18} className="shrink-0 text-brass-ink" />
            {verified} of {plural(reviews.length, "review")} from verified buyers
          </p>
        ) : null}

        <div className="mt-6 border-t border-hairline pt-6">
          <p className="mb-3 text-body-sm text-taupe">Worn it? Help the next buyer choose.</p>
          <ReviewComposer productHandle={productHandle} productName={productName} />
        </div>
      </aside>

      <div className="min-w-0">
        <div className="flex min-h-10 flex-wrap items-center justify-between gap-3 border-b border-hairline pb-4">
          <p className="text-body-sm text-taupe" aria-live="polite">
            {stars
              ? `${plural(filtered.length, `${STAR_WORD[stars]} star review`)}`
              : `${plural(filtered.length, "review")}, newest first`}
          </p>
          {stars ? (
            <button
              type="button"
              onClick={() => filterBy(null)}
              className="inline-flex min-h-10 cursor-pointer items-center text-caption font-semibold text-ink underline decoration-hairline underline-offset-4 hover:decoration-ink"
            >
              Show all reviews
            </button>
          ) : null}
        </div>

        <ul className="divide-y divide-hairline">
          {visible.map((r) => (
            <li key={r.id} className="py-7">
              <article>
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                  <StarRating rating={r.rating} size="sm" />
                  {r.dateLabel ? (
                    <time dateTime={r.date} className="text-caption text-taupe">
                      {r.dateLabel}
                    </time>
                  ) : null}
                </div>
                {r.title ? <h3 className="mt-3 text-heading-sm text-ink">{r.title}</h3> : null}
                <p className={cn("max-w-[65ch] text-body text-ink/80", r.title ? "mt-1.5" : "mt-3")}>{r.body}</p>
                <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span
                    aria-hidden="true"
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-caption font-semibold text-brass-ink"
                  >
                    {initials(r.author)}
                  </span>
                  <span className="text-body-sm font-semibold text-ink">
                    {r.author}
                    {r.city ? <span className="font-normal text-taupe"> · {r.city}</span> : null}
                  </span>
                  {r.verified ? (
                    <span className="inline-flex items-center gap-1 text-caption text-brass-ink">
                      <CircleCheckIcon size={15} />
                      Verified buyer
                    </span>
                  ) : null}
                </div>
              </article>
            </li>
          ))}
        </ul>

        {filtered.length > shown ? (
          <div className="border-t border-hairline pt-6">
            <Button type="button" variant="secondary" size="sm" onClick={() => setShown((v) => v + PAGE)}>
              Show more reviews ({filtered.length - shown})
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
