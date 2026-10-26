import { ReviewsBrowser, type ReviewItem } from "@/components/product/reviews-browser";

type ReviewDoc = {
  _id?: unknown;
  rating: number;
  title?: string;
  body: string;
  author: string;
  city?: string;
  verified?: boolean;
  createdAt?: Date | string;
};

const dateLabel = (value?: Date | string) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  // Fixed zone so the server and browser print the same day.
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Karachi",
  });
};

/**
 * Social proof right after the scent details: rating summary with a star
 * breakdown, filterable review list, and a "Write a review" dialog.
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
  const items: ReviewItem[] = reviews.map((r, i) => ({
    id: String(r._id ?? `${r.author}-${i}`),
    rating: Math.max(1, Math.min(5, Math.round(r.rating))),
    title: r.title?.trim() || "",
    body: r.body,
    author: r.author,
    city: r.city?.trim() || "",
    verified: Boolean(r.verified),
    date: r.createdAt ? new Date(r.createdAt).toISOString() : "",
    dateLabel: dateLabel(r.createdAt),
  }));

  // The product's stored rating is recalculated whenever a review is published;
  // fall back to the list itself if it is missing.
  const count = items.length || reviewCount;
  const average =
    rating > 0
      ? rating
      : items.length
        ? items.reduce((s, r) => s + r.rating, 0) / items.length
        : 0;

  return (
    <section
      id="reviews"
      aria-labelledby="reviews-heading"
      className="scroll-mt-[calc(var(--spacing-chrome-height)+1rem)] border-b border-hairline bg-canvas py-14 lg:py-20"
    >
      <div className="container-ns">
        <p className="mb-3 text-eyebrow text-taupe">Reviews</p>
        <h2 id="reviews-heading" className="text-display-md text-ink">
          What wearers say
        </h2>
        <ReviewsBrowser
          productHandle={productHandle}
          productName={productName}
          average={average}
          count={count}
          reviews={items}
        />
      </div>
    </section>
  );
}
