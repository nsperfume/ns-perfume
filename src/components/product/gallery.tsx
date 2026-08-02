"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/cn";

export function ProductGallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const [active, setActive] = useState(0);
  const list = images.length ? images : ["/products/placeholder-lifestyle.svg"];

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-square w-full bg-paper">
        <Image
          src={list[active]}
          alt={`NS Perfume ${name} bottle view ${active + 1}`}
          fill
          priority
          fetchPriority="high"
          quality={80}
          className="object-contain p-10"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
      </div>
      <div className="grid grid-cols-5 gap-2">
        {list.map((src, i) => (
          <button
            key={src + i}
            type="button"
            onClick={() => setActive(i)}
            className={cn(
              "relative aspect-square border bg-paper",
              i === active ? "border-ink" : "border-hairline",
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
              className="object-contain p-2"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
