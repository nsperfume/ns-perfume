import { cn } from "@/lib/cn";

type ReviewDoc = {
  _id?: unknown;
  rating: number;
  title?: string;
  body: string;
  author: string;
  city?: string;
  verified?: boolean;
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={cn(
            "font-mono text-[12px]",
            i < Math.round(rating) ? "text-brass" : "text-hairline",
          )}
          aria-hidden
        >
          ★
        </span>
      ))}
    </span>
  );
}

export function ProductReviewsSection({
  rating,
  reviewCount,
  reviews,
}: {
  rating: number;
  reviewCount: number;
  reviews: ReviewDoc[];
}) {
  return (
    <section id="reviews" className="scroll-mt-[calc(var(--chrome-height)+1rem)] border-t border-hairline section-y">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-display-md">Product Reviews</h2>
          <p className="mt-2 font-serif text-[1.05rem] text-taupe">
            {reviewCount > 0
              ? `${rating.toFixed(1)} average from ${reviewCount} review${reviewCount === 1 ? "" : "s"}`
              : "No written reviews yet for this bottle."}
          </p>
        </div>
        {rating > 0 ? (
          <div className="flex items-center gap-2">
            <Stars rating={rating} />
            <span className="font-mono text-[13px] text-taupe">
              {rating.toFixed(1)} / 5
            </span>
          </div>
        ) : null}
      </div>

      {reviews.length === 0 ? (
        <p className="font-serif text-body text-taupe">
          Reviews appear here after verified purchases are published.
        </p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {reviews.map((r) => (
            <li
              key={String(r._id || `${r.author}-${r.title}`)}
              className="flex flex-col border border-hairline bg-paper p-5 sm:p-6"
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Stars rating={r.rating} />
                {r.verified ? (
                  <span className="rounded-xs bg-ink px-2 py-0.5 font-display text-[10px] uppercase tracking-[0.12em] text-paper">
                    Verified
                  </span>
                ) : null}
              </div>
              {r.title ? (
                <h3 className="font-display text-[1.1rem] font-medium text-ink">
                  {r.title}
                </h3>
              ) : null}
              <p className="mt-2 flex-1 font-serif text-[1.05rem] leading-relaxed text-ink/80">
                {r.body}
              </p>
              <p className="mt-4 font-serif text-[0.95rem] text-taupe">
                {r.author}
                {r.city ? ` · ${r.city}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
