"use client";

import { useState } from "react";
import { siteConfig } from "@/data/site";
import { formatPkMobile } from "@/lib/checkout";
import { cn } from "@/lib/cn";

/** "PK68MEZN0009110111027312" -> ["PK68", "MEZN", ...] so it only wraps between groups. */
function groupsOf(value: string, size = 4) {
  return value.replace(/\s+/g, "").match(new RegExp(`.{1,${size}}`, "g")) ?? [value];
}

function CopyGlyph({ copied }: { copied: boolean }) {
  return copied ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

/**
 * Shows a value in readable groups (each group never breaks) and copies the
 * plain value without spaces, which is what bank apps expect.
 */
function CopyRow({
  value,
  display,
  label,
}: {
  value: string;
  /** Groups to show; defaults to the value as one unbroken group. */
  display?: string[];
  label: string;
}) {
  const [copied, setCopied] = useState(false);
  const parts = display ?? [value];

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  return (
    <span className="flex min-h-8 max-w-full items-start gap-2.5">
      <span className="min-w-0 flex-1 font-sans text-base font-medium leading-8 tabular-nums text-ink">
        {parts.map((part, i) => (
          <span key={i}>
            {i > 0 ? " " : null}
            <span className="whitespace-nowrap">{part}</span>
          </span>
        ))}
      </span>
      <button
        type="button"
        onClick={copy}
        className={cn(
          "inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md border bg-paper transition-colors hover:border-ink/30 hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass/40",
          copied ? "border-brass/40 text-brass" : "border-hairline text-ink",
        )}
        aria-label={copied ? "Copied" : label}
        title={copied ? "Copied" : label}
      >
        <CopyGlyph copied={copied} />
      </button>
      <span className="sr-only" aria-live="polite">
        {copied ? "Copied" : ""}
      </span>
    </span>
  );
}

const labelClass = "text-eyebrow text-taupe";
const valueClass = "mt-1 font-sans text-base font-semibold leading-8 text-ink";

/** Meezan Bank and mobile wallet details for the checkout and thank-you pages. */
export function BankDetails({ className }: { className?: string }) {
  const bank = siteConfig.bankTransfer;
  const wallets = siteConfig.wallets;
  const sameWallet = wallets.jazzcash === wallets.easypaisa;

  return (
    <dl
      className={cn(
        "grid grid-cols-1 gap-x-6 gap-y-4 rounded-xs border border-hairline bg-paper p-4 sm:grid-cols-2 sm:p-5",
        className,
      )}
    >
      <div>
        <dt className={labelClass}>Bank</dt>
        <dd className={valueClass}>{bank.bankName}</dd>
      </div>
      <div>
        <dt className={labelClass}>Account title</dt>
        <dd className={valueClass}>{bank.accountTitle}</dd>
      </div>
      <div className="sm:col-span-2">
        <dt className={labelClass}>Account number</dt>
        <dd className="mt-1">
          <CopyRow value={bank.accountNumber} label="Copy account number" />
        </dd>
      </div>
      <div className="sm:col-span-2">
        <dt className={labelClass}>IBAN</dt>
        <dd className="mt-1">
          <CopyRow value={bank.iban} display={groupsOf(bank.iban)} label="Copy IBAN" />
        </dd>
      </div>
      <div className="sm:col-span-2">
        <dt className={labelClass}>Branch</dt>
        <dd className={valueClass}>{bank.branch}</dd>
      </div>
      {sameWallet ? (
        <div className="sm:col-span-2">
          <dt className={labelClass}>JazzCash or Easypaisa</dt>
          <dd className="mt-1">
            <CopyRow
              value={wallets.jazzcash}
              display={formatPkMobile(wallets.jazzcash).split(" ")}
              label="Copy wallet number"
            />
          </dd>
        </div>
      ) : (
        <>
          <div>
            <dt className={labelClass}>JazzCash</dt>
            <dd className="mt-1">
              <CopyRow
                value={wallets.jazzcash}
                display={formatPkMobile(wallets.jazzcash).split(" ")}
                label="Copy JazzCash number"
              />
            </dd>
          </div>
          <div>
            <dt className={labelClass}>Easypaisa</dt>
            <dd className="mt-1">
              <CopyRow
                value={wallets.easypaisa}
                display={formatPkMobile(wallets.easypaisa).split(" ")}
                label="Copy Easypaisa number"
              />
            </dd>
          </div>
        </>
      )}
    </dl>
  );
}
