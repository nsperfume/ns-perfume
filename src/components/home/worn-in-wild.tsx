"use client";

import Image from "next/image";
import { useRef, type PointerEvent } from "react";
import { pageCopy } from "@/data/copy";
import { siteImages, wornInWildAlts } from "@/data/images";
import { cn } from "@/lib/cn";

const frames = [
  { label: "Wrist", note: "Pulse point at golden hour" },
  { label: "Collar", note: "Day wear, soft light" },
  { label: "Fabric", note: "Scent held in cloth" },
] as const;

function WornShot({
  src,
  alt,
  index,
  label,
  note,
}: {
  src: string;
  alt: string;
  index: number;
  label: string;
  note: string;
}) {
  const rootRef = useRef<HTMLElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);

  const onMove = (event: PointerEvent<HTMLElement>) => {
    const root = rootRef.current;
    const media = mediaRef.current;
    if (!root || !media) return;
    const rect = root.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    media.style.transform = `scale(1.06) translate(${x * -10}px, ${y * -10}px)`;
  };

  const onLeave = () => {
    const media = mediaRef.current;
    if (!media) return;
    media.style.transform = "scale(1) translate(0px, 0px)";
  };

  return (
    <figure
      ref={rootRef}
      className="group relative"
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-ink">
        <div
          ref={mediaRef}
          className="absolute inset-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
        >
          <Image
            src={src}
            alt={alt}
            fill
            loading="lazy"
            quality={85}
            className="object-cover object-center"
            sizes="(max-width: 640px) 100vw, 33vw"
          />
        </div>

        <div
          className={cn(
            "pointer-events-none absolute inset-0 bg-linear-to-t from-black/70 via-black/15 to-transparent",
            "opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100 group-focus-within:opacity-100",
          )}
          aria-hidden
        />

        <div
          className={cn(
            "absolute inset-x-0 bottom-0 flex translate-y-3 items-end justify-between gap-3 p-4 opacity-0",
            "transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            "group-hover:translate-y-0 group-hover:opacity-100",
            "group-focus-within:translate-y-0 group-focus-within:opacity-100",
            "md:p-5",
          )}
        >
          <div>
            <p className="font-display text-[0.95rem] font-medium tracking-wide text-paper">
              {label}
            </p>
            <p className="mt-0.5 font-serif text-[0.95rem] text-paper/75">
              {note}
            </p>
          </div>
          <p className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-paper/55">
            {String(index + 1).padStart(2, "0")}
          </p>
        </div>
      </div>

      <figcaption className="mt-3 flex items-baseline justify-between gap-3 sm:mt-3.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-taupe">
          {String(index + 1).padStart(2, "0")} · {label}
        </span>
        <span className="hidden font-serif text-[0.9rem] text-taupe/80 sm:inline">
          {note}
        </span>
      </figcaption>
    </figure>
  );
}

export function WornInWild() {
  const shots = siteImages.wornInWild;

  return (
    <section className="border-b border-hairline bg-canvas section-y">
      <div className="container-ns">
        <div className="mb-6 max-w-xl sm:mb-8 md:mb-10">
          <p className="mb-2 font-display text-[11px] font-medium uppercase tracking-[0.16em] text-taupe">
            In life
          </p>
          <h2 className="text-display-lg text-balance text-ink">
            Worn in the wild
          </h2>
          <p className="mt-2 text-pretty font-serif text-[1.05rem] leading-relaxed text-taupe">
            {pageCopy.wornInWild}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-4 md:gap-5">
          {shots.map((src, i) => (
            <WornShot
              key={src}
              src={src}
              alt={wornInWildAlts[i] ?? "Fragrance worn in everyday light"}
              index={i}
              label={frames[i]?.label ?? "In wear"}
              note={frames[i]?.note ?? "Everyday light"}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
