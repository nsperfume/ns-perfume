"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Fast tooltips site-wide (or wrap a subtree). Default delay 120ms. */
export function TooltipProvider({
  children,
  delayDuration = 120,
  skipDelayDuration = 0,
}: {
  children: ReactNode;
  delayDuration?: number;
  skipDelayDuration?: number;
}) {
  return (
    <TooltipPrimitive.Provider
      delayDuration={delayDuration}
      skipDelayDuration={skipDelayDuration}
    >
      {children}
    </TooltipPrimitive.Provider>
  );
}

type TooltipProps = {
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  className?: string;
  /** Accessible label when trigger is icon-only */
  "aria-label"?: string;
};

/**
 * Radix Tooltip. Trigger should accept a ref (button works best).
 * Opens quickly for admin help text.
 */
export function Tooltip({
  content,
  children,
  side = "top",
  align = "center",
  className,
  "aria-label": ariaLabel,
}: TooltipProps) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild aria-label={ariaLabel}>
        {children}
      </TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          align={align}
          sideOffset={6}
          className={cn(
            "z-120 max-w-[16rem] rounded-md border border-black/10 bg-ink px-2.5 py-1.5 font-display text-xs font-medium leading-snug text-paper shadow-modal",
            className,
          )}
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-ink" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

/** Compact info button with tooltip — use next to form labels. */
export function FieldHint({
  content,
  label = "More info",
}: {
  content: ReactNode;
  label?: string;
}) {
  return (
    <Tooltip content={content} aria-label={label}>
      <button
        type="button"
        className="inline-flex h-5 w-5 shrink-0 cursor-help items-center justify-center rounded-full border border-admin-line bg-admin-soft font-display text-[10px] font-semibold text-admin-muted transition-colors hover:border-admin-muted hover:text-admin-ink"
      >
        ?
      </button>
    </Tooltip>
  );
}

function InfoCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      aria-hidden
    >
      <circle
        cx="8"
        cy="8"
        r="6.25"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <path
        d="M8 7.25v3.5"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
      <circle cx="8" cy="5.15" r="0.85" fill="currentColor" />
    </svg>
  );
}

/** Storefront info hint for product specs (sillage, longevity, etc.). */
export function InfoTip({
  content,
  label = "More info",
}: {
  content: ReactNode;
  label?: string;
}) {
  return (
    <Tooltip
      content={content}
      aria-label={label}
      side="top"
      className="max-w-[15.5rem] px-3 py-2 font-serif text-[0.8rem] font-normal leading-snug tracking-normal"
    >
      <button
        type="button"
        className="inline-flex h-5 w-5 shrink-0 cursor-help items-center justify-center rounded-full text-ink/55 transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass/40"
      >
        <InfoCircleIcon className="h-[15px] w-[15px]" />
      </button>
    </Tooltip>
  );
}
