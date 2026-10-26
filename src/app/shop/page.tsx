/** Legacy path: the full catalog lives at /products. Permanent so search engines move the URL. */
import { permanentRedirect } from "next/navigation";

export default function ShopPage() {
  permanentRedirect("/products");
}
