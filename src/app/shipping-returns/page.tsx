import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { describeShipping } from "@/lib/checkout-config";
import { getSiteSettings } from "@/lib/site-settings";

export const metadata: Metadata = {
  title: "Shipping and returns",
  description:
    "Delivery across Pakistan with standard and express options, unopened returns within 30 days, and damaged parcel reporting.",
  alternates: { canonical: "/shipping-returns" },
};

export default async function ShippingReturnsPage() {
  const { checkout } = await getSiteSettings();
  return (
    <section className="bg-canvas section-y">
      <div className="container-ns max-w-[48rem]">
        <h1 className="mb-10 text-display-xl">Shipping and returns</h1>
        <div className="flex flex-col gap-10 text-body-lg text-taupe">
          <div>
            <h2 className="text-heading-sm mb-3 text-ink">Shipping</h2>
            <p>
              {describeShipping(checkout)} In-stock orders placed before 2pm
              ship the next business day.
            </p>
          </div>
          <div>
            <h2 className="text-heading-sm mb-3 text-ink">Returns</h2>
            <p>
              Unopened bottles in original packaging may be returned within 30 days
              of delivery. Opened fragrance is final sale unless there is a verified
              quality defect. To start a return, contact care with your order
              number and we will guide you through the next steps.
            </p>
          </div>
          <div>
            <h2 className="text-heading-sm mb-3 text-ink">Damage</h2>
            <p>
              Photograph broken glass within 48 hours of delivery and we will
              replace or refund the line item after review.
            </p>
          </div>
        </div>
        <div className="mt-12 flex flex-wrap gap-4">
          <Button href="/track-order">Track an order</Button>
          <Button href="/policies/shipping" variant="secondary">
            Full shipping policy
          </Button>
          <Link href="/contact" className="inline-flex min-h-11 items-center self-center text-label text-brass-ink underline decoration-brass/40 underline-offset-[6px]">
            Contact care
          </Link>
        </div>
      </div>
    </section>
  );
}
