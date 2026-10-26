"use client";

import type { CSSProperties } from "react";
import { Toaster, toast } from "sonner";

/**
 * Admin toasts (sonner) in the console palette. Use for the outcome of every
 * save, delete, status change and upload; keep inline errors for fields.
 *
 *   toast.success("Product saved")
 *   toast.error(res.error || "Could not save")
 */
export { toast };

function Glyph({ d, className }: { d: string; className: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  success: (
    <Glyph d="M4.5 10.5l3.5 3.5 7.5-8" className="h-5 w-5 text-brass" />
  ),
  error: (
    <Glyph
      d="M10 6v5M10 14.2v.3M10 2.5l8 14.5H2z"
      className="h-5 w-5 text-admin-danger"
    />
  ),
  warning: (
    <Glyph
      d="M10 6v5M10 14.2v.3M10 2.5l8 14.5H2z"
      className="h-5 w-5 text-(--admin-tone-amber-text)"
    />
  ),
  info: (
    <Glyph
      d="M10 9v5M10 6.2v.3M10 18a8 8 0 100-16 8 8 0 000 16z"
      className="h-5 w-5 text-admin-muted"
    />
  ),
};

export function AdminToaster({ theme }: { theme: "light" | "dark" }) {
  return (
    <Toaster
      theme={theme}
      position="bottom-right"
      // Clear the sticky save bars on edit pages
      offset={{ bottom: 92, right: 24 }}
      mobileOffset={{ bottom: 88, left: 12, right: 12 }}
      closeButton
      duration={4500}
      icons={ICONS}
      style={
        {
          "--normal-bg": "var(--admin-paper)",
          "--normal-border": "var(--admin-line)",
          "--normal-text": "var(--admin-ink)",
          "--border-radius": "10px",
          "--width": "380px",
          fontFamily: "inherit",
        } as CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "font-sans! gap-3! px-4! py-3.5! shadow-modal! text-[0.9375rem]!",
          title: "font-semibold! text-[0.9375rem]! leading-snug!",
          description: "text-admin-muted! text-sm!",
          closeButton:
            "bg-admin-paper! border-admin-line! text-admin-muted! hover:text-admin-ink!",
          actionButton: "bg-admin-ink! text-admin-paper! font-semibold!",
          error: "border-admin-danger/40!",
        },
      }}
    />
  );
}
