import { cn } from "@/lib/cn";

const PROCESS_STEPS = [
  {
    step: "01",
    title: "Place order",
    body: "Add to bag, checkout, pick COD or bank transfer.",
  },
  {
    step: "02",
    title: "Confirm",
    body: "We verify stock and call for COD when needed.",
  },
  {
    step: "03",
    title: "Dispatch",
    body: "Packed and handed to courier in 1 to 2 business days.",
  },
  {
    step: "04",
    title: "Deliver",
    body: "Trackable delivery across Pakistan.",
  },
] as const;

const ASSURANCES = [
  {
    title: "Cash on delivery",
    body: "Pay when the parcel arrives. Available in major cities.",
  },
  {
    title: "Complimentary shipping",
    body: "Free standard delivery on eligible orders over Rs 8,000.",
  },
  {
    title: "Easy returns",
    body: "Unused sealed bottles returnable within the stated window.",
  },
  {
    title: "Authenticity",
    body: "Formulas and packaging checked before every dispatch.",
  },
] as const;

export function ProductTrustProcess({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-10", className)}>
      <ol className="grid gap-0 border border-hairline sm:grid-cols-2 xl:grid-cols-4">
        {PROCESS_STEPS.map((item, i) => (
          <li
            key={item.step}
            className={cn(
              "bg-paper px-5 py-6",
              i > 0 && "border-t border-hairline sm:border-t-0",
              i % 2 === 1 && "sm:border-l",
              i >= 2 && "xl:border-t-0",
              i > 0 && "xl:border-l",
            )}
          >
            <p className="font-mono text-[11px] tabular-nums text-brass">
              {item.step}
            </p>
            <p className="mt-3 font-display text-[1rem] font-medium text-ink">
              {item.title}
            </p>
            <p className="mt-1.5 font-serif text-[0.95rem] leading-snug text-taupe">
              {item.body}
            </p>
          </li>
        ))}
      </ol>

      <ul className="grid gap-4 sm:grid-cols-2">
        {ASSURANCES.map((item) => (
          <li key={item.title} className="flex gap-4 border-t border-hairline pt-4">
            <span
              className="mt-2 h-px w-6 shrink-0 bg-brass"
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
  );
}
