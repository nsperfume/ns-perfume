"use client";

import { cn } from "@/lib/cn";
import type { MapCoords } from "@/lib/order-status";

/**
 * OpenStreetMap embed (no Google API key). Shopify-style delivery location map.
 */
export function DeliveryMap({
  map,
  className,
}: {
  map: MapCoords;
  className?: string;
}) {
  const { lat, lng, label, precision } = map;
  const delta = precision === "address" ? 0.008 : precision === "city" ? 0.04 : 0.12;
  const bbox = [
    lng - delta * 1.4,
    lat - delta,
    lng + delta * 1.4,
    lat + delta,
  ].join("%2C");

  const embedSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
  const openSrc = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=14/${lat}/${lng}`;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-hairline bg-canvas-deep",
        className,
      )}
    >
      <div className="relative aspect-[16/10] w-full sm:aspect-[2/1]">
        <iframe
          title={`Map: ${label}`}
          src={embedSrc}
          className="absolute inset-0 h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-hairline bg-paper px-4 py-3">
        <div>
          <p className="text-[13px] font-medium text-ink">{label}</p>
          <p className="text-[12px] text-taupe">
            {precision === "city"
              ? "Approximate delivery area"
              : precision === "region"
                ? "Region overview"
                : "Delivery location"}
          </p>
        </div>
        <a
          href={openSrc}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[13px] font-medium text-brass hover:underline"
        >
          Open map
        </a>
      </div>
    </div>
  );
}
