import { revalidatePath } from "next/cache";

/**
 * Storefront pages are cached (ISR) for speed. Call after any admin write that
 * changes what shoppers see; the next visit to each page renders fresh data.
 */
export function revalidateStorefront() {
  try {
    revalidatePath("/", "layout");
  } catch (e) {
    console.error("[revalidate] failed", e);
  }
}
