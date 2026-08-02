import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Shipping & Returns",
  description:
    "Domestic timelines, free shipping threshold, unopened returns within 30 days, and damaged parcel reporting.",
};

export default function ShippingReturnsPage() {
  return (
    <section className="bg-canvas section-y">
      <div className="container-ns max-w-2xl">
        <h1 className="text-display-lg mb-4">Shipping & returns</h1>
        <div className="flex flex-col gap-8 text-body text-taupe">
          <div>
            <h2 className="text-heading-sm mb-3 text-ink">Shipping</h2>
            <p>
              In-stock orders placed before 2pm warehouse time ship the next
              business day. Standard domestic delivery is typically three to seven
              days. Complimentary standard shipping applies over $75 where offered.
            </p>
          </div>
          <div>
            <h2 className="text-heading-sm mb-3 text-ink">Returns</h2>
            <p>
              Unopened bottles in original packaging may be returned within 30 days
              of delivery. Opened fragrance is final sale unless there is a verified
              quality defect. Start a return from your order email or contact care.
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
          <Link href="/contact" className="text-eyebrow text-brass self-center">
            Contact care
          </Link>
        </div>
      </div>
    </section>
  );
}
