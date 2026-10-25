import type { Metadata } from "next";
import { Suspense } from "react";
import { TrackOrderClient } from "@/components/track/track-order-client";

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
          <div className="flex min-h-dvh items-center justify-center bg-canvas text-base text-taupe">
            Loading…
          </div>
        }
      >
        <TrackOrderClient />
      </Suspense>
    </>
  );
}
