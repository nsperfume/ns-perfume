"use client";

import Image from "next/image";
import { useRef, type PointerEvent } from "react";
import { pageCopy } from "@/data/copy";
import { siteImages, wornInWildAlts } from "@/data/images";

const frames = [
  { label: "Wrist", note: "Pulse point at golden hour" },
  { label: "Collar", note: "Day wear, soft light" },
  { label: "Fabric", note: "Scent held in cloth" },
] as const;

function WornShot({
  src,
  alt,
  label,
  note,
}: {
  src: string;
  alt: string;
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
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-ink">
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

      </div>

      <figcaption className="mt-4 flex items-baseline justify-between gap-3">
        <span className="text-body-sm font-semibold text-ink">
          {label}
        </span>
        <span className="text-body-sm text-taupe">{note}</span>
      </figcaption>
    </figure>
  );
}

export function WornInWild() {
  const shots = siteImages.wornInWild;

  return (
    <section className="border-b border-hairline bg-canvas section-y">
      <div className="container-ns">
        <div className="mb-8 max-w-[44rem] sm:mb-10 lg:mb-14">
          <p className="mb-3 text-eyebrow text-taupe sm:mb-4">
            In life
          </p>
          <h2 className="text-display-lg text-balance text-ink">
            Worn in the wild
          </h2>
          <p className="mt-4 text-pretty text-body sm:text-body-lg text-taupe">
            {pageCopy.wornInWild}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-4 md:gap-5">
          {shots.map((src, i) => (
            <WornShot
              key={src}
              src={src}
              alt={wornInWildAlts[i] ?? "Fragrance worn in everyday light"}
              label={frames[i]?.label ?? "In wear"}
              note={frames[i]?.note ?? "Everyday light"}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
