"use client";

import { useEffect } from "react";
import "./globals.css";

/**
 * Last-resort boundary. Keeps markup self-contained so recovery still works
 * if shared UI modules fail to load.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error.digest || error.message, error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col bg-canvas text-ink antialiased">
        <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
          <div className="w-full max-w-lg text-center">
            <p className="mb-3 font-display text-[11px] font-medium uppercase tracking-[0.16em] text-taupe">
              Something went wrong
            </p>
            <h1 className="font-display text-[1.75rem] font-medium tracking-tight text-ink sm:text-[2rem]">
              This page could not load
            </h1>
            <p className="mt-4 font-serif text-[1.05rem] leading-relaxed text-taupe">
              A temporary fault stopped the site shell. Retry this page, or go
              back to the shop.
            </p>
            {error.digest ? (
              <p className="mt-4 font-mono text-[11px] tracking-wide text-taupe/80">
                Ref {error.digest}
              </p>
            ) : null}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={reset}
                className="inline-flex min-h-11 cursor-pointer items-center justify-center border border-ink bg-ink px-5 font-display text-sm uppercase tracking-[0.12em] text-paper transition-colors hover:bg-brass hover:border-brass"
              >
                Try again
              </button>
              <a
                href="/products"
                className="inline-flex min-h-11 items-center justify-center border border-hairline bg-paper px-5 font-display text-sm uppercase tracking-[0.12em] text-ink transition-colors hover:border-ink/40"
              >
                Shop all
              </a>
              <a
                href="/"
                className="inline-flex min-h-11 items-center justify-center px-4 font-display text-sm uppercase tracking-[0.12em] text-brass underline-offset-4 hover:underline"
              >
                Home
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
