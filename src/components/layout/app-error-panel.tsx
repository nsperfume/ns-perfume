"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
  /** Narrow copy for admin vs storefront */
  variant?: "store" | "admin";
  className?: string;
};

/**
 * Shared recovery UI for App Router error.tsx boundaries.
 */
export function AppErrorPanel({
  error,
  reset,
  variant = "store",
  className,
}: Props) {
  useEffect(() => {
    console.error("[app-error]", error.digest || error.message, error);
  }, [error]);

  const isAdmin = variant === "admin";

  return (
    <section
      className={cn(
        "flex flex-1 flex-col items-center justify-center bg-canvas px-4 py-16 sm:py-24",
        className,
      )}
    >
      <div className="w-full max-w-lg text-center">
        <p className="mb-3 font-display text-[11px] font-medium uppercase tracking-[0.16em] text-taupe">
          Something went wrong
        </p>
        <h1 className="font-display text-[1.75rem] font-medium tracking-tight text-ink sm:text-[2rem]">
          {isAdmin ? "Admin could not load this view" : "This page could not load"}
        </h1>
        <p className="mt-4 font-serif text-[1.05rem] leading-relaxed text-taupe">
          {isAdmin
            ? "A temporary fault stopped this screen. Try again, or return to the dashboard."
            : "A temporary fault stopped this screen. You can retry, or keep shopping from the catalog."}
        </p>
        {error.digest ? (
          <p className="mt-4 font-mono text-[11px] tracking-wide text-taupe/80">
            Ref {error.digest}
          </p>
        ) : null}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button type="button" onClick={reset} className="w-auto!">
            Try again
          </Button>
          <Button
            href={isAdmin ? "/admin" : "/products"}
            variant="secondary"
            className="w-auto!"
          >
            {isAdmin ? "Admin home" : "Shop all"}
          </Button>
          {!isAdmin ? (
            <Button href="/" variant="ghost" className="w-auto!">
              Home
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
