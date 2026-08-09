"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

type Props = {
  value: string;
  /** Optional link (e.g. tel: or mailto:) wrapping the value text. */
  href?: string;
  className?: string;
  valueClassName?: string;
  /** Accessible label for the copy action. */
  label?: string;
};

function CopyGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/**
 * Displays a value with a one-click copy control for phones, IBANs, etc.
 * Row height matches the copy button so text and icon stay optically centered.
 */
export function CopyableValue({
  value,
  href,
  className,
  valueClassName,
  label = "Copy",
}: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  const text = (
    <span
      className={cn(
        "block font-sans text-[1rem] font-medium leading-8 text-ink",
        "break-all tabular-nums tracking-normal [font-variant-numeric:lining-nums_tabular-nums]",
        valueClassName,
      )}
      style={{
        fontFamily: "var(--font-ubuntu), Ubuntu, system-ui, sans-serif",
      }}
    >
      {value}
    </span>
  );

  return (
    <span
      className={cn(
        "inline-flex min-h-8 max-w-full items-start gap-2.5",
        className,
      )}
    >
      {href ? (
        <a
          href={href}
          className="min-w-0 flex-1 transition-colors hover:text-brass"
        >
          {text}
        </a>
      ) : (
        <span className="min-w-0 flex-1">{text}</span>
      )}
      <button
        type="button"
        onClick={copy}
        className={cn(
          "inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-hairline bg-paper text-ink transition-colors",
          "hover:border-ink/30 hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass/40",
          copied && "border-brass/40 text-brass",
        )}
        aria-label={copied ? "Copied" : `${label}: ${value}`}
        title={copied ? "Copied" : label}
      >
        {copied ? (
          <CheckGlyph className="h-3.5 w-3.5" />
        ) : (
          <CopyGlyph className="h-3.5 w-3.5" />
        )}
      </button>
    </span>
  );
}
