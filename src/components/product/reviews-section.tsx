import { StarRating } from "@/components/ui/star-rating";
import { ProductReviewForm } from "@/components/product/review-form";
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

export function ProductReviewsSection({
  productHandle,
  productName,
  rating,
  reviewCount,
  reviews,
}: {
  productHandle: string;
  productName: string;
  rating: number;
  reviewCount: number;
  reviews: ReviewDoc[];
}) {
  return (
    <section
      id="reviews"
      className="scroll-mt-[calc(var(--spacing-chrome-height)+1rem)] border-t border-hairline section-y"
    >
      <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 font-display text-[11px] font-medium uppercase tracking-[0.16em] text-taupe">
            From wearers
          </p>
          <h2 className="text-display-md">Product reviews</h2>
          <p className="mt-2 font-serif text-[1.05rem] text-taupe">
            {reviewCount > 0
              ? `${reviewCount} review${reviewCount === 1 ? "" : "s"} for this bottle`
              : "No published reviews yet. Be the first to write about this bottle."}
          </p>
          <a
            href="#write-review"
            className="mt-3 inline-block font-display text-[12px] font-medium uppercase tracking-[0.12em] text-ink underline-offset-4 hover:underline"
          >
            Write a review
          </a>
        </div>
        {rating > 0 ? (
          <div className="flex items-center gap-3">
            <StarRating rating={rating} size="lg" />
            <span className="font-mono text-[1.05rem] font-medium tabular-nums text-ink">
              {rating.toFixed(1)}
              <span className="text-taupe"> / 5</span>
            </span>
          </div>
        ) : null}
      </div>

      {reviews.length === 0 ? (
        <p className="mb-10 font-serif text-body text-taupe">
          Published reviews show here after we check them. You can still leave
          yours below.
        </p>
      ) : (
        <ul className="mb-12 grid gap-0 md:grid-cols-2 md:gap-x-0 md:divide-x md:divide-hairline">
          {reviews.map((r, i) => (
            <li
              key={String(r._id || `${r.author}-${r.title}`)}
              className={cn(
                "flex flex-col border-b border-hairline py-6 md:border-b-0 md:px-8 md:py-2",
                i === 0 && "md:pl-0",
                i % 2 === 1 && "md:pr-0",
                i >= 2 && "md:mt-8 md:border-t md:border-hairline md:pt-8",
              )}
            >
              <div className="mb-3 flex flex-wrap items-center gap-2.5">
                <StarRating rating={r.rating} size="sm" />
                {r.verified ? (
                  <span className="bg-ink px-2 py-0.5 font-display text-[10px] uppercase tracking-[0.12em] text-paper">
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
              <p className="mt-5 font-serif text-[0.95rem] text-taupe">
                {r.author}
                {r.city ? ` · ${r.city}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}

      <ProductReviewForm
        productHandle={productHandle}
        productName={productName}
      />
    </section>
  );
}
