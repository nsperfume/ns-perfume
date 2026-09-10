"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { useCustomer } from "@/context/customer";
import { cn } from "@/lib/cn";

const STAR_PATH =
  "m12 2.5 2.9 5.88 6.49.94-4.7 4.58 1.11 6.47L12 17.27l-5.8 3.1 1.11-6.47-4.7-4.58 6.49-.94L12 2.5z";

export function ProductReviewForm({
  productHandle,
  productName,
}: {
  productHandle: string;
  productName: string;
}) {
  const { user } = useCustomer();
  const [author, setAuthor] = useState("");
  const [city, setCity] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (user?.name && !author) setAuthor(user.name);
  }, [user, author]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!author.trim()) next.author = "Add your name.";
    if (rating < 1 || rating > 5) next.rating = "Choose a star rating.";
    if (body.trim().length < 20)
      next.body = "Write at least a short note about how it wears.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    setErrors({});
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productHandle,
          author: author.trim(),
          city: city.trim(),
          title: title.trim(),
          body: body.trim(),
          rating,
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        setErrors({ form: json.error || "Could not submit review." });
        return;
      }
      setSent(true);
      setBody("");
      setTitle("");
      setCity("");
      setRating(0);
    } catch {
      setErrors({ form: "Network error. Try again in a moment." });
    } finally {
      setSaving(false);
    }
  }

  if (sent) {
    return (
      <div
        id="write-review"
        className="scroll-mt-[calc(var(--spacing-chrome-height)+1rem)] border border-hairline bg-muted/40 px-5 py-6 sm:px-6"
      >
        <p className="font-display text-[11px] font-medium uppercase tracking-[0.16em] text-taupe">
          Review received
        </p>
        <p className="mt-3 font-serif text-[1.1rem] leading-relaxed text-ink">
          Thanks. Your note on {productName} is with us for a quick check before
          it appears on this page.
        </p>
        <Button
          type="button"
          variant="secondary"
          className="mt-5 w-auto!"
          onClick={() => setSent(false)}
        >
          Write another
        </Button>
      </div>
    );
  }

  const displayRating = hoverRating || rating;

  return (
    <form
      id="write-review"
      onSubmit={onSubmit}
      className="scroll-mt-[calc(var(--spacing-chrome-height)+1rem)] border border-hairline bg-paper px-5 py-6 sm:px-6 md:px-8 md:py-8"
      noValidate
    >
      <p className="font-display text-[11px] font-medium uppercase tracking-[0.16em] text-taupe">
        Your turn
      </p>
      <h3 className="mt-2 font-display text-[1.35rem] font-medium text-ink">
        Review {productName}
      </h3>
      <p className="mt-2 max-w-xl font-serif text-[1.05rem] text-taupe">
        How it opens, how long it lasts, and where you wore it. We publish
        after a short check.
      </p>

      <div className="mt-6">
        <p className="mb-2 text-sm font-medium text-ink/80">Rating</p>
        <div
          className="inline-flex items-center gap-1"
          role="radiogroup"
          aria-label="Star rating"
          onMouseLeave={() => setHoverRating(0)}
        >
          {[1, 2, 3, 4, 5].map((value) => {
            const filled = displayRating >= value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={rating === value}
                aria-label={`${value} star${value === 1 ? "" : "s"}`}
                className="rounded-sm p-0.5 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass/60"
                onMouseEnter={() => setHoverRating(value)}
                onFocus={() => setHoverRating(value)}
                onBlur={() => setHoverRating(0)}
                onClick={() => setRating(value)}
              >
                <svg
                  viewBox="0 0 24 24"
                  className={cn(
                    "h-7 w-7 transition-colors",
                    filled ? "text-brass" : "text-[#d4cbb8]",
                  )}
                >
                  {filled ? (
                    <path fill="currentColor" d={STAR_PATH} />
                  ) : (
                    <path
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinejoin="round"
                      d={STAR_PATH}
                    />
                  )}
                </svg>
              </button>
            );
          })}
        </div>
        {errors.rating ? (
          <p className="mt-1.5 text-sm text-rosewood">{errors.rating}</p>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Input
          label="Name"
          name="author"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          error={errors.author}
          autoComplete="name"
          required
        />
        <Input
          label="City (optional)"
          name="city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Karachi"
          autoComplete="address-level2"
        />
      </div>

      <div className="mt-4">
        <Input
          label="Headline (optional)"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Lasts through dinner"
          maxLength={80}
        />
      </div>

      <div className="mt-4">
        <Textarea
          label="Your review"
          name="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          error={errors.body}
          placeholder="When you wore it, how close it sat, and what you noticed after an hour."
          rows={5}
          required
        />
      </div>

      {errors.form ? (
        <p className="mt-3 text-sm text-rosewood">{errors.form}</p>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={saving} className="w-auto!">
          {saving ? "Sending…" : "Submit review"}
        </Button>
        <p className="font-serif text-[0.95rem] text-taupe">
          Appears after moderation. Keep it honest and specific.
        </p>
      </div>
    </form>
  );
}
