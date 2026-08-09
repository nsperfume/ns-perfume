import { cn } from "@/lib/cn";

const PROCESS_STEPS = [
  {
    step: "01",
    title: "Place order",
    body: "Checkout with the payment method that suits you.",
  },
  {
    step: "02",
    title: "Confirm",
    body: "We verify stock before the parcel is packed.",
  },
  {
    step: "03",
    title: "Dispatch",
    body: "Leaves the warehouse in 1 to 2 business days.",
  },
  {
    step: "04",
    title: "Deliver",
    body: "Trackable delivery across Pakistan.",
  },
] as const;

/** Order process only. Assurances live once on shipping / homepage, not repeated here. */
export function ProductTrustProcess({ className }: { className?: string }) {
  return (
    <ol
      className={cn(
        "grid gap-0 border border-hairline sm:grid-cols-2 xl:grid-cols-4",
        className,
      )}
    >
      {PROCESS_STEPS.map((item, i) => (
        <li
          key={item.step}
          className={cn(
            "bg-paper px-5 py-6",
            i > 0 && "border-t border-hairline sm:border-t-0",
            i % 2 === 1 && "sm:border-l sm:border-hairline",
            i >= 2 && "xl:border-t-0",
            i > 0 && "xl:border-l xl:border-hairline",
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
  );
}
