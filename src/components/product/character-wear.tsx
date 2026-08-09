import { RichHtml } from "@/components/ui/rich-html";
import type { StoreProduct } from "@/lib/mappers";

/**
 * Editorial Character & wear: story + how-to-wear, no tab chrome.
 */
export function ProductCharacterWear({ product }: { product: StoreProduct }) {
  return (
    <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 xl:gap-20">
      <article>
        <p className="mb-3 font-display text-[11px] font-medium uppercase tracking-[0.16em] text-taupe">
          The story
        </p>
        <h3 className="font-display text-[1.35rem] font-medium tracking-tight text-ink md:text-[1.5rem]">
          Why {product.name} exists
        </h3>
        <RichHtml
          html={product.story}
          className="mt-5 text-pretty font-serif text-[1.15rem] leading-[1.75] text-ink/85"
        />
      </article>

      <aside className="flex flex-col justify-between gap-10 border-t border-hairline pt-10 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0 xl:pl-16">
        <div>
          <p className="mb-3 font-display text-[11px] font-medium uppercase tracking-[0.16em] text-taupe">
            How to wear
          </p>
          <h3 className="font-display text-[1.35rem] font-medium tracking-tight text-ink md:text-[1.5rem]">
            Placement and timing
          </h3>
          <RichHtml
            html={product.howToWear}
            className="mt-5 text-pretty font-serif text-[1.15rem] leading-[1.75] text-ink/85"
          />
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-5 border-t border-hairline pt-6">
          <div>
            <dt className="font-display text-[10px] font-medium uppercase tracking-[0.14em] text-taupe">
              Opens with
            </dt>
            <dd className="mt-2 font-serif text-[1rem] leading-snug text-ink">
              {product.topNotes.join(", ")}
            </dd>
          </div>
          <div>
            <dt className="font-display text-[10px] font-medium uppercase tracking-[0.14em] text-taupe">
              Heart
            </dt>
            <dd className="mt-2 font-serif text-[1rem] leading-snug text-ink">
              {product.heartNotes.join(", ")}
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="font-display text-[10px] font-medium uppercase tracking-[0.14em] text-taupe">
              Settles into
            </dt>
            <dd className="mt-2 font-serif text-[1rem] leading-snug text-ink">
              {product.baseNotes.join(", ")}
            </dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}
