"use client";

import { EmblaCarousel } from "@/components/ui/embla-carousel";
import { RichHtml } from "@/components/ui/rich-html";
import { isRichHtml, richTextToPlain } from "@/lib/rich-text";

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
          className="flex h-full min-h-[14rem] flex-col justify-between border-t border-hairline pt-8 sm:min-h-[16rem]"
        >
          {t.rating ? (
            <p className="mb-4 font-mono text-[12px] tabular-nums text-brass">
              {t.rating}/5
            </p>
          ) : (
            <div className="mb-4 h-px w-8 bg-brass" aria-hidden />
          )}
          <blockquote className="flex-1 font-serif text-[1.2rem] leading-relaxed text-ink sm:text-[1.35rem]">
            {isRichHtml(t.quote) ? (
              <RichHtml html={t.quote} />
            ) : (
              <>“{t.quote}”</>
            )}
          </blockquote>
          <figcaption className="mt-8">
            <p className="font-display text-[0.95rem] font-medium text-ink">
              {t.author}
            </p>
            <p className="mt-0.5 font-serif text-[0.9rem] text-taupe">
              {[t.city, t.productName].filter(Boolean).join(" · ")}
            </p>
          </figcaption>
        </figure>
      ))}
    </EmblaCarousel>
  );
}
