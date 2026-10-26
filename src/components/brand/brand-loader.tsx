"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

type Props = {
  /** Rendered size in px (square). */
  size?: number;
  /** Screen-reader text. */
  label?: string;
  /** Optional visible caption under the mark. */
  caption?: string;
  className?: string;
};

/** Final, fully drawn frame: used for reduced motion. */
const STILL_FRAME = 104;

/**
 * NS Perfume loader: the monogram draws itself in brass, fills, then the three
 * scent-pyramid bars (top, heart, base) unfold. lottie-web (light build) and the
 * animation load only when a loader is actually shown, so pages don't pay for it.
 */
export function BrandLoader({ size = 96, label = "Loading", caption, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let destroyed = false;
    let instance: { destroy: () => void } | null = null;

    Promise.all([import("lottie-web/build/player/lottie_light"), import("./ns-loader.json")]).then(
      ([{ default: lottie }, { default: data }]) => {
        if (destroyed) return;
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const anim = lottie.loadAnimation({
          container: el,
          renderer: "svg",
          loop: !reduced,
          autoplay: !reduced,
          // The player mutates animation data; give each instance its own copy.
          animationData: structuredClone(data),
          rendererSettings: { preserveAspectRatio: "xMidYMid meet", progressiveLoad: false },
        });
        if (reduced) anim.addEventListener("DOMLoaded", () => anim.goToAndStop(STILL_FRAME, true));
        instance = anim;
      },
    );

    return () => {
      destroyed = true;
      instance?.destroy();
    };
  }, []);

  return (
    <div role="status" aria-live="polite" className={cn("inline-flex flex-col items-center gap-3", className)}>
      <div ref={ref} aria-hidden="true" style={{ width: size, height: size }} />
      {caption ? <p className="text-caption text-taupe">{caption}</p> : null}
      <span className="sr-only">{label}</span>
    </div>
  );
}

/** Centered loader for page and section loading states. */
export function BrandLoaderBlock({
  label = "Loading",
  caption,
  className,
  size = 104,
}: Props) {
  return (
    <div className={cn("flex min-h-[50vh] w-full items-center justify-center py-16", className)}>
      <BrandLoader size={size} label={label} caption={caption} />
    </div>
  );
}
