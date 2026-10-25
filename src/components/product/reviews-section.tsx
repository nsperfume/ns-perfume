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
          <p className="mb-3 text-eyebrow text-taupe">
            From wearers
          </p>
          <h2 className="text-display-md">Product reviews</h2>
          <p className="mt-2 text-body text-taupe">
            {reviewCount > 0
              ? `${reviewCount} review${reviewCount === 1 ? "" : "s"} for this bottle`
              : "No published reviews yet. Be the first to write about this bottle."}
          </p>
          <a
            href="#write-review"
            className="mt-3 inline-flex min-h-11 items-center text-label text-ink underline decoration-ink/25 underline-offset-[6px] hover:text-brass-ink hover:decoration-brass"
          >
            Write a review
          </a>
        </div>
        {rating > 0 ? (
          <div className="flex items-center gap-3">
            <StarRating rating={rating} size="lg" />
            <span className="font-mono text-lg font-medium tabular-nums text-ink">
              {rating.toFixed(1)}
              <span className="text-taupe"> / 5</span>
            </span>
          </div>
        ) : null}
      </div>

      {reviews.length === 0 ? (
        <p className="mb-10 text-body text-taupe">
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
                i % 2 === 0 && "md:pl-0",
                i % 2 === 1 && "md:pr-0",
                i >= 2 && "md:mt-8 md:border-t md:border-hairline md:pt-8",
              )}
            >
              <div className="mb-3 flex flex-wrap items-center gap-2.5">
                <StarRating rating={r.rating} size="sm" />
                {r.verified ? (
                  <span className="bg-ink px-2 py-0.5 text-eyebrow text-paper">
                    Verified
                  </span>
                ) : null}
              </div>
              {r.title ? (
                <h3 className="font-sans text-lg font-semibold text-ink">
                  {r.title}
                </h3>
              ) : null}
              <p className="mt-2 flex-1 text-body text-ink/80">
                {r.body}
              </p>
              <p className="mt-5 text-body-sm text-taupe">
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
