"use client";

import { CopyableValue } from "@/components/ui/copyable-value";
import { siteConfig } from "@/data/site";
import { cn } from "@/lib/cn";

type Props = {
  className?: string;
  /** Show JazzCash / Easypaisa rows. Default true. */
  showWallets?: boolean;
};

const labelClass =
  "text-eyebrow text-taupe";
const valueClass =
  "mt-1 font-sans text-base font-semibold leading-8 text-ink";

/**
 * Shared Meezan Bank + mobile wallet details for checkout and thank-you.
 */
export function TransferDetails({ className, showWallets = true }: Props) {
  const bank = siteConfig.bankTransfer;
  const wallets = siteConfig.wallets;

  return (
    <dl
      className={cn(
        "grid grid-cols-1 gap-x-6 gap-y-4 rounded-xl border border-hairline bg-paper p-5 sm:grid-cols-2",
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
          <CopyableValue
            value={bank.accountNumber}
            label="Copy account number"
          />
        </dd>
      </div>
      <div className="sm:col-span-2">
        <dt className={labelClass}>IBAN</dt>
        <dd className="mt-1">
          <CopyableValue value={bank.iban} label="Copy IBAN" />
        </dd>
      </div>
      <div className="sm:col-span-2">
        <dt className={labelClass}>Branch</dt>
        <dd className={valueClass}>{bank.branch}</dd>
      </div>
      {showWallets ? (
        wallets.jazzcash === wallets.easypaisa ? (
          <div className="sm:col-span-2">
            <dt className={labelClass}>JazzCash or Easypaisa</dt>
            <dd className="mt-1">
              <CopyableValue
                value={wallets.jazzcash}
                label="Copy wallet number"
              />
            </dd>
          </div>
        ) : (
          <>
            <div>
              <dt className={labelClass}>JazzCash</dt>
              <dd className="mt-1">
                <CopyableValue
                  value={wallets.jazzcash}
                  label="Copy JazzCash number"
                />
              </dd>
            </div>
            <div>
              <dt className={labelClass}>Easypaisa</dt>
              <dd className="mt-1">
                <CopyableValue
                  value={wallets.easypaisa}
                  label="Copy Easypaisa number"
                />
              </dd>
            </div>
          </>
        )
      ) : null}
    </dl>
  );
}
