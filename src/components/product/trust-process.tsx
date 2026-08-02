import { cn } from "@/lib/cn";

const PROCESS_STEPS = [
  { step: "01", title: "Place Order", body: "Bag, checkout, or cash on delivery." },
  { step: "02", title: "Confirm", body: "We verify stock and call for COD orders." },
  { step: "03", title: "Dispatch", body: "Packed and handed to courier in 1 to 2 days." },
  { step: "04", title: "Deliver", body: "Trackable delivery across Pakistan." },
] as const;

const ASSURANCES = [
  {
    title: "Cash On Delivery",
    body: "Pay when the parcel arrives. Available in major cities.",
  },
  {
    title: "Complimentary Shipping",
    body: "Free delivery on eligible orders over Rs 8,000.",
  },
  {
    title: "Easy Returns",
    body: "Unused sealed bottles returnable within the stated window.",
  },
  {
    title: "Authenticity",
    body: "Formulas and packaging checked before every dispatch.",
  },
] as const;

export function ProductTrustProcess({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-8", className)}>
      <div>
        <p className="mb-3 font-display text-[11px] font-medium uppercase tracking-[0.16em] text-taupe">
          How Ordering Works
        </p>
        <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {PROCESS_STEPS.map((item) => (
            <li
              key={item.step}
              className="border border-hairline bg-[#FAF8F4] px-4 py-4"
            >
              <p className="font-mono text-[11px] text-brass">{item.step}</p>
              <p className="mt-2 font-display text-[0.95rem] font-medium text-ink">
                {item.title}
              </p>
              <p className="mt-1 font-serif text-[0.95rem] leading-snug text-taupe">
                {item.body}
              </p>
            </li>
          ))}
        </ol>
      </div>

      <div>
        <p className="mb-3 font-display text-[11px] font-medium uppercase tracking-[0.16em] text-taupe">
          Shopping Assurances
        </p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {ASSURANCES.map((item) => (
            <li
              key={item.title}
              className="flex gap-3 border border-hairline bg-paper px-4 py-4"
            >
              <span
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink"
                aria-hidden
              />
              <div>
                <p className="font-display text-[0.95rem] font-medium text-ink">
                  {item.title}
                </p>
                <p className="mt-1 font-serif text-[0.95rem] leading-snug text-taupe">
                  {item.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
