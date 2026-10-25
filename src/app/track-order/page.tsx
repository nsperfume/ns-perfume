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
      {/* The client view streams in behind Suspense, so the page H1 lives here. */}
      <h1 className="sr-only">Track your order</h1>
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
