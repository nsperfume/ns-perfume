"use client";

import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
  Children,
} from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { cn } from "@/lib/cn";

type CarouselProps = {
  children: ReactNode;
  className?: string;
  slideClassName?: string;
  align?: "start" | "center";
  loop?: boolean;
  showDots?: boolean;
  showArrows?: boolean;
  gap?: "sm" | "md" | "lg";
  /** Auto-advance delay in ms. 0 disables. */
  autoplayDelay?: number;
};

const gapMap = {
  sm: "0.75rem",
  md: "1.25rem",
  lg: "1.75rem",
} as const;

export function EmblaCarousel({
  children,
  className,
  slideClassName = "min-w-0 flex-[0_0_75%] sm:flex-[0_0_45%] lg:flex-[0_0_28%]",
  align = "start",
  loop = true,
  showDots = true,
  showArrows = true,
  gap = "md",
  autoplayDelay = 0,
}: CarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      align,
      loop,
      dragFree: false,
      containScroll: loop ? false : "trimSnaps",
    },
    autoplayDelay > 0
      ? [
          Autoplay({
            delay: autoplayDelay,
            stopOnInteraction: false,
            stopOnMouseEnter: true,
            stopOnFocusIn: true,
          }),
        ]
      : [],
  );
  const [selected, setSelected] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelected(emblaApi.selectedScrollSnap());
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  const slides = Children.toArray(children);

  return (
    <div className={cn("relative", className)}>
      <div
        className="overflow-hidden"
        ref={emblaRef}
        style={{ ["--carousel-gap" as string]: gapMap[gap] }}
      >
        <div
          className="flex items-start touch-pan-y"
          style={{ marginLeft: "calc(var(--carousel-gap) * -1)" }}
        >
          {slides.map((child, i) => (
            <div
              key={i}
              className={cn("pl-carousel-gap", slideClassName)}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {(showArrows || showDots) && (
        <div className="mt-4 flex items-center justify-between gap-3 sm:mt-6 sm:gap-4">
          {showDots ? (
            <div className="flex flex-wrap items-center gap-2">
              {scrollSnaps.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => emblaApi?.scrollTo(i)}
                  className={cn(
                    "h-1.5 cursor-pointer rounded-full transition-all duration-300",
                    i === selected
                      ? "w-6 bg-ink"
                      : "w-1.5 bg-hairline hover:bg-taupe/50",
                  )}
                />
              ))}
            </div>
          ) : (
            <span />
          )}

          {showArrows ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Previous"
                disabled={!canPrev && !loop}
                onClick={() => emblaApi?.scrollPrev()}
                className="flex h-10 w-10 cursor-pointer items-center justify-center border border-hairline bg-paper font-display text-lg text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-30"
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="Next"
                disabled={!canNext && !loop}
                onClick={() => emblaApi?.scrollNext()}
                className="flex h-10 w-10 cursor-pointer items-center justify-center border border-hairline bg-paper font-display text-lg text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-30"
              >
                ›
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
