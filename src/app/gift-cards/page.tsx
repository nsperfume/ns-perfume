"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/commerce/price";
import { PageHero } from "@/components/layout/page-hero";
import { useCart } from "@/context/cart";
import { useUi } from "@/context/ui";
import { pageCopy } from "@/data/copy";
import { siteImages } from "@/data/images";

const amounts = [5000, 10000, 15000, 25000];

export default function GiftCardsPage() {
  const { addItem } = useCart();
  const { showToast } = useUi();
  const [amount, setAmount] = useState(10000);

  return (
    <>
      <PageHero
        title={pageCopy.giftCards.title}
        description={pageCopy.giftCards.description}
        image={siteImages.giftCards}
        alt="NS Perfume gift card presentation with bottles in soft light"
        objectPosition="center 45%"
      />
      <section className="bg-canvas section-y">
        <div className="container-ns grid gap-12 lg:grid-cols-2">
          <div className="flex min-h-80 items-center justify-center rounded-lg border border-hairline bg-paper p-12">
            <div className="text-center">
              <p className="text-display-md">Gift Card</p>
              <div className="mt-4 text-2xl">
                <Price amountPkr={amount} />
              </div>
            </div>
          </div>
          <div>
            <p className="mb-2 text-caption text-taupe">Amount</p>
            <div className="mb-8 flex flex-wrap gap-2">
              {amounts.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAmount(a)}
                  className={`min-h-11 rounded-xs border px-4 font-mono text-sm ${
                    amount === a
                      ? "border-ink bg-ink text-paper"
                      : "border-hairline text-taupe"
                  }`}
                >
                  <Price amountPkr={a} className="text-sm" />
                </button>
              ))}
            </div>
            <Button
              onClick={() => {
                addItem({
                  productHandle: "gift-card",
                  name: "Gift Card",
                  sizeMl: 0,
                  price: amount,
                  sku: `NS-GC-${amount}`,
                  image: siteImages.giftCards,
                });
                showToast("Gift card added to your bag", "cart");
              }}
            >
              Add Gift Card
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
