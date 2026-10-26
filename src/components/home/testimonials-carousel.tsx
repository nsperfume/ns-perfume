"use client";

import { EmblaCarousel } from "@/components/ui/embla-carousel";
import { StarRating } from "@/components/ui/star-rating";
import { TrustedHtml as RichHtml } from "@/components/ui/trusted-html";
import { htmlToPlain as richTextToPlain, isRichHtml } from "@/lib/plain-text";

export type TestimonialItem = {
  author: string;
  city?: string;
  quote: string;
  productName?: string;
  rating?: number;
};

export function TestimonialsCarousel({ items }: { items: TestimonialItem[] }) {
  if (!items.length) return null;

  return (
    <EmblaCarousel
      gap="md"
      align="start"
      loop
      autoplayDelay={5000}
      slideClassName="min-w-0 flex-[0_0_88%] sm:flex-[0_0_70%] lg:flex-[0_0_48%]"
      showDots
      showArrows
    >
      {items.map((t) => (
        <figure
          key={`${t.author}-${richTextToPlain(t.quote).slice(0, 24)}`}
          className="flex h-full min-h-[14rem] flex-col justify-between border-t border-hairline pt-8 sm:min-h-[17rem] lg:pr-8"
        >
          {t.rating ? (
            <StarRating rating={t.rating} size="sm" className="mb-5" />
          ) : (
            <div className="mb-4 h-px w-8 bg-brass" aria-hidden />
          )}
          <blockquote className="flex-1 font-serif text-[1.5rem] font-medium italic leading-[1.3] text-ink sm:text-[1.75rem] 2xl:text-[1.875rem]">
            {isRichHtml(t.quote) ? (
              <RichHtml html={t.quote} />
            ) : (
              <>“{t.quote}”</>
            )}
          </blockquote>
          <figcaption className="mt-8">
            <p className="text-base font-semibold text-ink">
              {t.author}
            </p>
            <p className="mt-0.5 text-body-sm text-taupe">
              {[t.city, t.productName].filter(Boolean).join(" · ")}
            </p>
          </figcaption>
        </figure>
      ))}
    </EmblaCarousel>
  );
}
