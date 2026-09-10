"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

const ROW_A = [
  "Perfume is worn for the room you walk into, not the bottle you leave at home",
  "Heat lifts citrus first, then the heart notes catch up on skin",
  "A spray settles in the first ten minutes. Wait before you judge it",
  "Scent sits closer to memory than almost any other sense",
  "Wear less in shared offices so the air stays kind for everyone",
  "Skin chemistry changes how the same formula reads on different people",
  "Humidity holds fragrance longer on fabric than on dry winter air",
  "One bottle you finish beats three you forget on a shelf",
  "Base notes of wood and musk stay after the opening has quieted",
  "Perfume marks a moment. Dinner, travel, a desk you return to",
  "Oil and alcohol formulas wear differently. Match the bottle to your skin",
  "Choosing concentration matters as much as choosing the notes",
];

const ROW_B = [
  "Over-spraying travels farther than you think in closed rooms",
  "Green and citrus open bright. Ambers and ouds sit warmer and lower",
  "The environment takes what evaporates. Skin keeps what bonds",
  "Light fabrics hold scent differently than wool or leather jackets",
  "Pulse points warm the formula so top notes move first",
  "A short mist on clothes can last longer than the same mist on skin",
  "Honest note lists help you match a bottle to heat and hour",
  "Fragrance is personal space. Give people next to you room to breathe",
  "Season shifts how long a scent stays readable on you",
  "What you smell first is rarely what others smell an hour later",
  "Finishing a bottle is quieter for the shelf and for the air",
  "Sillage is how far you announce yourself. Longevity is how long you stay",
];

type Direction = "ltr" | "rtl";

function MarqueeRow({
  phrases,
  direction,
  speed = 36,
}: {
  phrases: string[];
  direction: Direction;
  speed?: number;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const halfRef = useRef(0);
  const velocityRef = useRef(0);
  const draggingRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);
  const lastXRef = useRef(0);
  const lastTRef = useRef(0);

  useEffect(() => {
    const track = trackRef.current;
    const viewport = viewportRef.current;
    if (!track || !viewport) return;

    const measure = () => {
      halfRef.current = track.scrollWidth / 2;
    };
    measure();

    const wrap = (value: number) => {
      const half = halfRef.current;
      if (half <= 0) return value;
      let next = value;
      while (next <= -half) next += half;
      while (next > 0) next -= half;
      return next;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 && event.pointerType === "mouse") return;
      draggingRef.current = true;
      pointerIdRef.current = event.pointerId;
      velocityRef.current = 0;
      lastXRef.current = event.clientX;
      lastTRef.current = performance.now();
      viewport.setPointerCapture(event.pointerId);
      viewport.classList.add("cursor-grabbing");
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!draggingRef.current || pointerIdRef.current !== event.pointerId) {
        return;
      }
      const now = performance.now();
      const dx = event.clientX - lastXRef.current;
      const dt = Math.max(now - lastTRef.current, 1);
      offsetRef.current = wrap(offsetRef.current + dx);
      velocityRef.current = dx / dt;
      lastXRef.current = event.clientX;
      lastTRef.current = now;
      gsap.set(track, { x: offsetRef.current });
    };

    const endDrag = (event: PointerEvent) => {
      if (pointerIdRef.current !== event.pointerId) return;
      draggingRef.current = false;
      pointerIdRef.current = null;
      viewport.classList.remove("cursor-grabbing");
      if (viewport.hasPointerCapture(event.pointerId)) {
        viewport.releasePointerCapture(event.pointerId);
      }
    };

    viewport.addEventListener("pointerdown", onPointerDown);
    viewport.addEventListener("pointermove", onPointerMove);
    viewport.addEventListener("pointerup", endDrag);
    viewport.addEventListener("pointercancel", endDrag);

    const baseDir = direction === "ltr" ? 1 : -1;
    const pxPerFrame = speed / 60;

    const tick = () => {
      if (!draggingRef.current) {
        if (Math.abs(velocityRef.current) > 0.02) {
          offsetRef.current = wrap(
            offsetRef.current + velocityRef.current * 16,
          );
          velocityRef.current *= 0.95;
        } else {
          velocityRef.current = 0;
          offsetRef.current = wrap(offsetRef.current + pxPerFrame * baseDir);
        }
      }
      gsap.set(track, { x: offsetRef.current });
    };

    gsap.ticker.add(tick);
    const ro = new ResizeObserver(measure);
    ro.observe(track);

    return () => {
      gsap.ticker.remove(tick);
      ro.disconnect();
      viewport.removeEventListener("pointerdown", onPointerDown);
      viewport.removeEventListener("pointermove", onPointerMove);
      viewport.removeEventListener("pointerup", endDrag);
      viewport.removeEventListener("pointercancel", endDrag);
    };
  }, [direction, speed]);

  const sequence = [...phrases, ...phrases];

  return (
    <div
      ref={viewportRef}
      className="cursor-grab touch-pan-y select-none overflow-hidden py-2.5 md:py-3"
      role="presentation"
    >
      <div ref={trackRef} className="flex w-max will-change-transform">
        {sequence.map((text, i) => (
          <span
            key={`${text}-${i}`}
            className="inline-flex shrink-0 items-center gap-5 px-5 md:gap-7 md:px-7"
          >
            <span className="whitespace-nowrap font-serif text-[0.9rem] leading-none text-paper/90 md:text-[1.05rem]">
              {text}
            </span>
            <span
              className="h-0.75 w-0.75 shrink-0 rounded-full bg-brass/70"
              aria-hidden
            />
          </span>
        ))}
      </div>
    </div>
  );
}

export function PerfumeMarquee({ className }: { className?: string }) {
  return (
    <section
      aria-label="Notes on wearing perfume"
      className={cn(
        "relative overflow-x-clip overflow-y-hidden border-b border-white/10 bg-ink",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-20 w-14 bg-linear-to-r from-ink via-ink/90 to-transparent sm:w-24 md:w-40"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-20 w-14 bg-linear-to-l from-ink via-ink/90 to-transparent sm:w-24 md:w-40"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-20 w-10 backdrop-blur-[2px] sm:w-16 md:w-24"
        style={{
          maskImage: "linear-gradient(to right, black, transparent)",
          WebkitMaskImage: "linear-gradient(to right, black, transparent)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-20 w-10 backdrop-blur-[2px] sm:w-16 md:w-24"
        style={{
          maskImage: "linear-gradient(to left, black, transparent)",
          WebkitMaskImage: "linear-gradient(to left, black, transparent)",
        }}
        aria-hidden
      />

      <div
        className="relative z-1 py-4 md:py-5"
        style={{
          maskImage:
            "linear-gradient(to right, transparent 0%, black 7%, black 93%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0%, black 7%, black 93%, transparent 100%)",
        }}
      >
        <p className="sr-only">
          Drag or swipe the lines to move them. They loop continuously.
        </p>
        <MarqueeRow phrases={ROW_A} direction="ltr" speed={32} />
        <div
          className="mx-auto h-px w-[min(100%,42rem)] bg-white/10"
          aria-hidden
        />
        <MarqueeRow phrases={ROW_B} direction="rtl" speed={38} />
      </div>
    </section>
  );
}
