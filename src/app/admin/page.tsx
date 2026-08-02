import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminSession } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";
import { SeedCatalogButton } from "@/components/admin/seed-button";
import { connectDB } from "@/lib/db";
import { ProductModel } from "@/models/Product";
import { OrderModel } from "@/models/Order";
import { CollectionModel } from "@/models/Collection";
import { ReviewModel } from "@/models/Review";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  let stats = {
    products: 0,
    orders: 0,
    collections: 0,
    pendingReviews: 0,
  };

  try {
    await connectDB();
    const [products, orders, collections, pendingReviews] = await Promise.all([
      ProductModel.countDocuments({ status: "active" }),
      OrderModel.countDocuments(),
      CollectionModel.countDocuments(),
      ReviewModel.countDocuments({ status: "pending" }),
    ]);
    stats = { products, orders, collections, pendingReviews };
  } catch {
    /* db optional until seeded */
  }

  const cards = [
    { label: "Products", value: stats.products, href: "/admin/products" },
    { label: "Collections", value: stats.collections, href: "/admin/collections" },
    { label: "Orders", value: stats.orders, href: "/admin/orders" },
    {
      label: "Pending reviews",
      value: stats.pendingReviews,
      href: "/admin/reviews",
    },
  ];

  return (
    <AdminShell
      user={{
        email: typeof session.email === "string" ? session.email : undefined,
        name: typeof session.name === "string" ? session.name : undefined,
      }}
    >
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Home</h1>
          <p className="mt-1 text-sm text-[#6d7175]">
            Store overview — custom Shopify-style admin
          </p>
        </div>
        <SeedCatalogButton />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-xl border border-[#e1e3e5] bg-white p-5 shadow-sm transition hover:border-[#c9cccf]"
          >
            <p className="text-sm text-[#6d7175]">{c.label}</p>
            <p className="mt-2 text-3xl font-semibold">{c.value}</p>
          </Link>
        ))}
      </div>
      <div className="mt-8 rounded-xl border border-[#e1e3e5] bg-white p-6">
        <h2 className="text-base font-semibold">Quick start</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-[#4a4a4a]">
          <li>Seed the catalog into MongoDB once from the button above.</li>
          <li>
            Manage inventory under{" "}
            <Link href="/admin/products" className="text-[#005bd3]">
              Products
            </Link>
            .
          </li>
          <li>
            Testimonials (homepage) and Reviews (PDP) are separate sections.
          </li>
          <li>
            Add Cloudinary env vars for product image uploads.
          </li>
        </ol>
      </div>
    </AdminShell>
  );
}
