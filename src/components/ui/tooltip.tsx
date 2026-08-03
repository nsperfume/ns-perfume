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
            "z-[120] max-w-[16rem] rounded-md border border-black/10 bg-ink px-2.5 py-1.5 font-display text-xs font-medium leading-snug text-paper shadow-modal",
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
        className="inline-flex h-5 w-5 shrink-0 cursor-help items-center justify-center rounded-full border border-[var(--admin-line)] bg-[var(--admin-soft)] font-display text-[10px] font-semibold text-[var(--admin-muted)] transition-colors hover:border-[var(--admin-muted)] hover:text-[var(--admin-ink)]"
      >
        ?
      </button>
    </Tooltip>
  );
}
