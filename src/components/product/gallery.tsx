"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/cn";

export function ProductGallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const list = images.length ? images : ["/products/placeholder-lifestyle.svg"];
  const [active, setActive] = useState(0);

  const go = useCallback(
    (dir: -1 | 1) => {
      setActive((i) => (i + dir + list.length) % list.length);
    },
    [list.length],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  return (
    <div className="flex flex-col gap-3 lg:sticky lg:top-[calc(var(--chrome-height)+1.25rem)] lg:flex-row lg:items-start lg:gap-3">
      {/* Desktop vertical thumbs */}
      <div className="hidden max-h-[min(70vh,36rem)] shrink-0 flex-col gap-2 overflow-y-auto scrollbar-panel lg:flex">
        {list.map((src, i) => (
          <button
            key={`${src}-d-${i}`}
            type="button"
            onClick={() => setActive(i)}
            className={cn(
              "relative h-16 w-16 shrink-0 overflow-hidden bg-muted transition-[box-shadow,opacity] duration-300",
              i === active
                ? "ring-1 ring-ink ring-offset-2 ring-offset-canvas"
                : "opacity-70 hover:opacity-100",
            )}
            aria-label={`Show image ${i + 1}`}
            aria-current={i === active ? "true" : undefined}
          >
            <Image
              src={src}
              alt=""
              fill
              loading="lazy"
              quality={70}
              sizes="64px"
              className="object-contain p-1.5"
            />
          </button>
        ))}
      </div>

      <div className="relative min-w-0 flex-1">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted sm:aspect-square">
          <Image
            src={list[active]}
            alt={`NS Perfume ${name}, view ${active + 1} of ${list.length}`}
            fill
            priority
            fetchPriority="high"
            quality={85}
            className="object-contain p-6 transition-opacity duration-500 sm:p-10"
            sizes="(max-width: 1024px) 100vw, 48vw"
          />
          {list.length > 1 ? (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center bg-paper/90 text-ink shadow-sm transition-opacity hover:bg-paper"
                aria-label="Previous image"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center bg-paper/90 text-ink shadow-sm transition-opacity hover:bg-paper"
                aria-label="Next image"
              >
                ›
              </button>
            </>
          ) : null}
          <p className="absolute bottom-3 right-3 font-mono text-[11px] tabular-nums text-taupe">
            {active + 1} / {list.length}
          </p>
        </div>

        {/* Mobile thumbs */}
        <div className="mt-3 grid grid-cols-5 gap-2 lg:hidden">
          {list.map((src, i) => (
            <button
              key={`${src}-m-${i}`}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "relative aspect-square overflow-hidden bg-muted",
                i === active ? "ring-1 ring-ink" : "opacity-80",
              )}
              aria-label={`Show image ${i + 1}`}
            >
              <Image
                src={src}
                alt=""
                fill
                loading="lazy"
                quality={70}
                sizes="80px"
                className="object-contain p-1.5"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
