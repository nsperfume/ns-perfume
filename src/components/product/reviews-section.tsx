import { StarRating } from "@/components/ui/star-rating";
import { ReviewComposer } from "@/components/product/review-composer";

type ReviewDoc = {
  _id?: unknown;
  rating: number;
  title?: string;
  body: string;
  author: string;
  city?: string;
  verified?: boolean;
};

/**
 * Social proof right after the scent details: rating summary, review cards,
 * and a "Write a review" button that opens the form inline.
 */
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
      className="scroll-mt-[calc(var(--spacing-chrome-height)+1rem)] border-b border-hairline bg-canvas py-14 lg:py-20"
    >
      <div className="container-ns grid gap-8 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:items-start lg:gap-20">
        <div>
          <p className="mb-3 text-eyebrow text-taupe">Reviews</p>
          <h2 className="text-display-md text-ink">What wearers say</h2>
          {reviewCount > 0 && rating > 0 ? (
            <div className="mt-5 flex items-center gap-3">
              <span className="font-mono text-3xl font-medium tabular-nums text-ink">
                {rating.toFixed(1)}
              </span>
              <div>
                <StarRating rating={rating} size="md" />
                <p className="mt-0.5 text-caption text-taupe">
                  From {reviewCount} review{reviewCount === 1 ? "" : "s"}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-4 max-w-[30rem] text-body text-taupe">
              No published reviews yet. Notes from wearers show here after a
              short check, so yours could be the first.
            </p>
          )}
          <div className="mt-6">
            <ReviewComposer
              productHandle={productHandle}
              productName={productName}
            />
          </div>
        </div>

        {reviews.length ? (
          <ul className="-mx-[var(--gutter)] flex snap-x snap-mandatory gap-3 overflow-x-auto px-[var(--gutter)] pb-2 md:mx-0 md:grid md:snap-none md:grid-cols-2 md:gap-4 md:overflow-visible md:px-0 md:pb-0">
            {reviews.slice(0, 6).map((r) => (
              <li
                key={String(r._id || `${r.author}-${r.title}`)}
                className="flex w-[85%] shrink-0 snap-start flex-col rounded-xs border border-hairline bg-paper p-5 sm:w-[60%] sm:p-6 md:w-auto"
              >
                <div className="flex flex-wrap items-center gap-2.5">
                  <StarRating rating={r.rating} size="sm" />
                  {r.verified ? (
                    <span className="text-eyebrow text-brass-ink">
                      Verified buyer
                    </span>
                  ) : null}
                </div>
                {r.title ? (
                  <h3 className="mt-3 font-sans text-lg font-semibold leading-snug text-ink">
                    {r.title}
                  </h3>
                ) : null}
                <p className="mt-2 flex-1 text-body text-ink/80">{r.body}</p>
                <p className="mt-4 text-body-sm text-taupe">
                  {r.author}
                  {r.city ? ` · ${r.city}` : ""}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
