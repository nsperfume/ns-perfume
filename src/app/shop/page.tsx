/** Legacy path — full catalog lives at /products */
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Shop all",
  alternates: { canonical: "/products" },
};

export default function ShopPage() {
  redirect("/products");
}
