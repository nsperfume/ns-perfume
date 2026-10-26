/**
 * Tiny wrapper over the Web Animations API (built into every modern browser),
 * replacing gsap for UI transitions so no animation library ships to shoppers.
 */

export const EASE = {
  out: "cubic-bezier(0.22, 1, 0.36, 1)",
  in: "cubic-bezier(0.55, 0, 1, 0.45)",
  inOut: "cubic-bezier(0.65, 0, 0.35, 1)",
  back: "cubic-bezier(0.34, 1.56, 0.64, 1)",
} as const;

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Animate an element. Entrance animations default to `fill: "backwards"` so the
 * element returns to its CSS state afterwards; pass `fill: "forwards"` for exits.
 * Returns null (and skips the animation) for reduced motion or missing elements.
 */
export function animate(
  el: Element | null | undefined,
  keyframes: Keyframe[],
  options: KeyframeAnimationOptions = {},
): Animation | null {
  if (!el || typeof (el as HTMLElement).animate !== "function" || prefersReducedMotion()) return null;
  return el.animate(keyframes, { duration: 300, easing: EASE.out, fill: "backwards", ...options });
}

/** Resolve when an animation ends (immediately when it was skipped or cancelled). */
export function finished(animation: Animation | null) {
  return animation ? animation.finished.then(() => undefined, () => undefined) : Promise.resolve();
}
