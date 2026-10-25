import Link from "next/link";
import type { ReactNode } from "react";
import { ProductTrustProcess } from "@/components/product/trust-process";
import { policies } from "@/data/site";
import { DeliveryPaymentNote } from "@/components/product/delivery-payment-note";
import type { StoreProduct } from "@/lib/mappers";

function Item({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details className="group border-b border-hairline" open={defaultOpen}>
      <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 py-5 text-heading-sm text-ink marker:content-none [&::-webkit-details-marker]:hidden">
        {title}
        <span
          className="text-2xl font-light leading-none text-brass-ink transition-transform duration-300 group-open:rotate-45"
          aria-hidden
        >
          +
        </span>
      </summary>
      <div className="pb-8">{children}</div>
    </details>
  );
}

/**
 * Practical details buyers check last: materials, how delivery and payment
 * work, and returns. Native <details>, so it works without JavaScript.
 */
export function ProductDetailsAccordion({ product }: { product: StoreProduct }) {
  const refund = policies.refund;

  return (
    <section className="border-b border-hairline bg-paper py-14 lg:py-20">
      <div className="container-ns grid gap-8 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:gap-20">
        <div>
          <p className="mb-3 text-eyebrow text-taupe">Good to know</p>
          <h2 className="text-display-md text-ink">Details</h2>
        </div>

        <div className="border-t border-hairline">
          <Item title="Ingredients and sourcing">
            <p className="max-w-[40rem] text-body text-taupe">
              Country of origin: {product.countryOfOrigin}.
              {product.containsAlcohol
                ? " Core materials are listed for transparency, not as full IFRA paperwork."
                : " This bottle is alcohol-free. Core materials are listed for transparency, not as full IFRA paperwork."}
            </p>
            {product.ingredients.length ? (
              <ul className="mt-5 columns-1 gap-x-10 sm:columns-2">
                {product.ingredients.map((ing) => (
                  <li
                    key={ing}
                    className="mb-2 break-inside-avoid border-b border-hairline pb-2 text-body-sm text-ink/85"
                  >
                    {ing}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-body-sm text-taupe">
                Full material notes are on the packing insert.
              </p>
            )}
          </Item>

          <Item title="Delivery and payment">
            <DeliveryPaymentNote className="max-w-[40rem] text-body text-taupe" />
            <ProductTrustProcess className="mt-5" />
          </Item>

          <Item title="Returns">
            <ul className="max-w-[40rem] space-y-3">
              {refund.sections.map((s) => (
                <li key={s.heading} className="text-body text-taupe">
                  <span className="font-semibold text-ink">{s.heading}. </span>
                  {s.body}
                </li>
              ))}
            </ul>
            <Link
              href="/policies/refund"
              className="mt-4 inline-flex min-h-11 items-center text-label text-ink underline decoration-ink/25 underline-offset-[6px] hover:text-brass-ink hover:decoration-brass"
            >
              Full refund policy
            </Link>
          </Item>
        </div>
      </div>
    </section>
  );
}
