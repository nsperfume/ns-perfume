import type { Metadata } from "next";
import { Suspense } from "react";
import { TrackOrderClient } from "@/components/track/track-order-client";
import { BrandLoaderBlock } from "@/components/brand/brand-loader";

export const metadata: Metadata = {
  title: "Track your order",
  description:
    "Look up your NS Perfume order with the order number and email used at checkout.",
  robots: { index: false, follow: false },
};

export default function TrackOrderPage() {
  return (
    <>
      {/* The client view renders the visible H1 (lookup form or order status). */}
      <Suspense
        fallback={
          <BrandLoaderBlock className="min-h-dvh bg-canvas" label="Loading order tracking" />
        }
      >
        <TrackOrderClient />
      </Suspense>
    </>
  );
}
