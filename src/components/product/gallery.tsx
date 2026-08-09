"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/cn";

function Chevron({
  dir,
  className,
}: {
  dir: "left" | "right";
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {dir === "left" ? (
        <path d="M15 18 9 12l6-6" />
      ) : (
        <path d="m9 18 6-6-6-6" />
      )}
    </svg>
  );
}

/**
 * Main square + full-width 2-up grid (same column width as the hero).
 */
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
    <div className="w-full min-w-0">
      {/* Hero — full column width */}
      <div className="group relative aspect-square w-full overflow-hidden bg-[#f5f5f5]">
        {list.map((src, i) => (
          <div
            key={`${src}-hero-${i}`}
            className={cn(
              "absolute inset-0 transition-opacity duration-500 ease-out",
              i === active ? "opacity-100" : "pointer-events-none opacity-0",
            )}
            aria-hidden={i !== active}
          >
            <Image
              src={src}
              alt={
                i === 0 ? `${name} perfume bottle` : `${name}, view ${i + 1}`
              }
              fill
              priority={i === 0}
              fetchPriority={i === 0 ? "high" : "auto"}
              quality={90}
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 58vw, 720px"
              className="object-contain object-center p-4 sm:p-6"
            />
          </div>
        ))}

        {list.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              className={cn(
                "absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center",
                "border border-hairline bg-paper/95 text-ink opacity-0 transition-opacity duration-300",
                "hover:border-ink/30 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass/40",
                "max-md:opacity-100",
              )}
              aria-label="Previous image"
            >
              <Chevron dir="left" className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className={cn(
                "absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center",
                "border border-hairline bg-paper/95 text-ink opacity-0 transition-opacity duration-300",
                "hover:border-ink/30 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass/40",
                "max-md:opacity-100",
              )}
              aria-label="Next image"
            >
              <Chevron dir="right" className="h-4 w-4" />
            </button>
            <p className="absolute bottom-3 left-3 z-10 font-display text-[10px] font-medium uppercase tracking-[0.16em] text-taupe">
              {active + 1} / {list.length}
            </p>
          </>
        ) : null}
      </div>

      {/* Same width as hero — exactly 2 per row */}
      {list.length > 1 ? (
        <ul className="mt-2 grid w-full grid-cols-2 gap-2 sm:mt-3 sm:gap-3">
          {list.map((src, i) => (
            <li key={`${src}-cell-${i}`} className="min-w-0">
              <button
                type="button"
                onClick={() => setActive(i)}
                className={cn(
                  "relative aspect-square w-full cursor-pointer overflow-hidden bg-[#f5f5f5] transition-opacity duration-300",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass/40",
                  i === active
                    ? "ring-1 ring-ink ring-offset-2 ring-offset-canvas"
                    : "hover:opacity-90",
                )}
                aria-label={`Show image ${i + 1}`}
                aria-current={i === active ? "true" : undefined}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  loading="lazy"
                  quality={85}
                  sizes="(max-width: 768px) 50vw, (max-width: 1280px) 29vw, 360px"
                  className="object-contain object-center p-3 sm:p-4"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
