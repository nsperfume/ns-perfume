"use client";

import Image from "next/image";
import { useState } from "react";
import type { CartLine } from "@/lib/types";
import { formatSize } from "@/lib/format";
import { useCurrency } from "@/context/currency";
import { FREE_SHIPPING_THRESHOLD_PKR } from "@/lib/checkout";
import { cn } from "@/lib/cn";

type SummaryProps = {
  lines: CartLine[];
  subtotalPkr: number;
  discountPkr: number;
  discountCode: string;
  shippingPkr: number | null;
  shippingLabel?: string;
  totalPkr: number;
  onApplyDiscount: (code: string) => string | null | Promise<string | null>;
  onRemoveDiscount: () => void;
  mobileCollapsed?: boolean;
};

export function CheckoutOrderSummary({
  lines,
  subtotalPkr,
  discountPkr,
  discountCode,
  shippingPkr,
  shippingLabel,
  totalPkr,
  onApplyDiscount,
  onRemoveDiscount,
}: SummaryProps) {
  const { format, currency } = useCurrency();
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [openMobile, setOpenMobile] = useState(false);
  const [applying, setApplying] = useState(false);

  const apply = async () => {
    setApplying(true);
    setCodeError(null);
    try {
      const err = await onApplyDiscount(codeInput);
      setCodeError(err);
      if (!err) setCodeInput("");
    } finally {
      setApplying(false);
    }
  };

  const freeShipGap = Math.max(0, FREE_SHIPPING_THRESHOLD_PKR - (subtotalPkr - discountPkr));

  const body = (
    <>
      <ul className="max-h-[40vh] space-y-5 overflow-y-auto pr-1 lg:max-h-none">
        {lines.map((line) => (
          <li key={line.sku} className="flex gap-3.5">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-hairline bg-paper">
              <Image
                src={line.image}
                alt=""
                fill
                className="object-contain p-1.5"
                sizes="64px"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-base font-medium leading-snug text-ink">
                {line.name}
                {line.isGift ? " (Gift)" : ""}
              </p>
              <p className="mt-0.5 text-sm text-taupe">
                Qty {line.quantity}
                {line.sizeMl > 0 ? ` · ${formatSize(line.sizeMl)}` : ` · ${line.sku}`}
                {line.giftWrap ? " · Gift wrap" : line.isGift ? " · Gift" : ""}
              </p>
              {line.giftWrap ? (
                <p className="mt-1 text-sm text-taupe">Gift wrap included</p>
              ) : null}
              {line.giftMessage ? (
                <p className="mt-1 text-sm leading-snug text-taupe">
                  <span className="text-taupe">Gift note: </span>
                  {line.giftMessage}
                </p>
              ) : null}
            </div>
            <p className="shrink-0 font-display text-base tabular-nums text-ink">
              {format(line.price * line.quantity)}
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex gap-2">
        <input
          type="text"
          value={codeInput}
          onChange={(e) => {
            setCodeInput(e.target.value);
            setCodeError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              apply();
            }
          }}
          placeholder="Discount code or gift card"
          className="min-h-12 flex-1 rounded-md border border-hairline bg-paper px-3 font-serif text-base text-ink outline-none focus:border-brass focus:ring-2 focus:ring-brass/20"
        />
        <button
          type="button"
          onClick={apply}
          className="min-h-12 cursor-pointer rounded-md border border-ink bg-ink px-5 font-display text-sm font-medium uppercase tracking-[0.12em] text-paper transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!codeInput.trim() || applying}
        >
          {applying ? "…" : "Apply"}
        </button>
      </div>
      {codeError ? (
        <p className="mt-2 font-display text-sm text-rosewood">{codeError}</p>
      ) : null}
      {discountCode ? (
        <div className="mt-3 flex items-center justify-between rounded-md bg-paper px-3 py-2 text-sm">
          <span className="font-medium text-ink">
            {discountCode}
            <button
              type="button"
              onClick={onRemoveDiscount}
              className="ml-2 cursor-pointer text-taupe hover:text-ink"
              aria-label="Remove discount"
            >
              ×
            </button>
          </span>
          <span className="text-ink">−{format(discountPkr)}</span>
        </div>
      ) : null}

      {freeShipGap > 0 ? (
        <p className="mt-4 text-sm leading-snug text-taupe">
          Add {format(freeShipGap)} more for complimentary standard shipping.
        </p>
      ) : (
        <p className="mt-4 text-sm leading-snug text-taupe">
          Your order qualifies for complimentary standard shipping.
        </p>
      )}

      <div className="mt-5 space-y-2 border-t border-hairline pt-4 text-base">
        <div className="flex justify-between text-taupe">
          <span>Subtotal</span>
          <span className="text-ink">{format(subtotalPkr)}</span>
        </div>
        {discountPkr > 0 ? (
          <div className="flex justify-between text-taupe">
            <span>Discount</span>
            <span className="text-ink">−{format(discountPkr)}</span>
          </div>
        ) : null}
        <div className="flex justify-between text-taupe">
          <span>Shipping</span>
          <span className="text-ink">
            {shippingPkr === null
              ? "Enter shipping address"
              : shippingPkr === 0
                ? "Free"
                : format(shippingPkr)}
            {shippingLabel && shippingPkr !== null ? (
              <span className="ml-1 text-sm text-taupe">
                · {shippingLabel}
              </span>
            ) : null}
          </span>
        </div>
        <div className="flex justify-between text-taupe">
          <span>Estimated taxes</span>
          <span className="text-ink">{format(0)}</span>
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between border-t border-hairline pt-4">
        <span className="font-display text-base font-medium text-ink">Total</span>
        <div className="text-right">
          <span className="mr-2 font-display text-xs text-taupe">{currency}</span>
          <span className="font-display text-2xl font-medium tracking-tight text-ink">
            {format(totalPkr)}
          </span>
        </div>
      </div>
    </>
  );

  return (
    <>
      <div className="border-b border-hairline bg-canvas-deep lg:hidden">
        <button
          type="button"
          className="flex w-full cursor-pointer items-center justify-between px-5 py-4 text-left"
          onClick={() => setOpenMobile((v) => !v)}
          aria-expanded={openMobile}
        >
          <span className="font-display text-sm font-medium text-brass">
            {openMobile ? "Hide order summary" : "Show order summary"}
            <span className="ml-1 inline-block text-[10px] opacity-80">
              {openMobile ? "▴" : "▾"}
            </span>
          </span>
          <span className="font-display text-base font-medium text-ink">
            {format(totalPkr)}
          </span>
        </button>
        <div
          className={cn(
            "overflow-hidden border-t border-hairline px-5 transition-[max-height] duration-300",
            openMobile ? "max-h-[80vh] py-5" : "max-h-0",
          )}
        >
          {body}
        </div>
      </div>

      {/* Desktop sticky summary */}
      <aside className="hidden h-full border-l border-hairline bg-canvas-deep lg:block">
        <div className="sticky top-0 max-h-dvh overflow-y-auto px-10 py-10 xl:px-14">
          {body}
        </div>
      </aside>
    </>
  );
}
