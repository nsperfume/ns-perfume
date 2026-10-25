import { RichHtml } from "@/components/ui/rich-html";
import type { StoreProduct } from "@/lib/mappers";

/**
 * Editorial Character & wear: story + how-to-wear, no tab chrome.
 * Notes live in the Composition band above, so they are not repeated here.
 */
export function ProductCharacterWear({ product }: { product: StoreProduct }) {
  return (
    <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 xl:gap-20">
      <article>
        <h3 className="text-display-sm text-ink">
          Why {product.name} exists
        </h3>
        <RichHtml
          html={product.story}
          className="mt-4 max-w-[38rem] text-pretty text-body-lg text-ink/85"
        />
      </article>

      <article className="border-t border-hairline pt-10 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0 xl:pl-16">
        <h3 className="text-display-sm text-ink">Placement and timing</h3>
        <RichHtml
          html={product.howToWear}
          className="mt-4 max-w-[38rem] text-pretty text-body-lg text-ink/85"
        />
      </article>
    </div>
  );
}
