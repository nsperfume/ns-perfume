"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";

type R = {
  _id: string;
  productHandle: string;
  author: string;
  city?: string;
  rating: number;
  title?: string;
  body: string;
  status: string;
  verified?: boolean;
};

export default function AdminReviewsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(null);
  const [items, setItems] = useState<R[]>([]);

  function load() {
    fetch("/api/reviews?all=1")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setItems(j.data);
      });
  }

  useEffect(() => {
    fetch("/api/admin/auth")
      .then((r) => r.json())
      .then((j) => {
        if (!j.ok) router.replace("/admin/login");
        else setUser(j.data);
      });
    load();
  }, [router]);

  async function setStatus(id: string, status: string) {
    await fetch(`/api/reviews/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete review?")) return;
    await fetch(`/api/reviews/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <AdminShell user={user}>
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">
        Product reviews
      </h1>
      <p className="mb-6 text-sm text-[#6d7175]">
        Reviews attached to products (PDP). Separate from site testimonials.
      </p>
      <div className="space-y-3">
        {items.map((r) => (
          <div
            key={r._id}
            className="rounded-xl border border-[#e1e3e5] bg-white p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">
                  {r.author}
                  {r.city ? ` · ${r.city}` : ""} · {r.rating}/5
                </p>
                <p className="text-xs text-[#6d7175]">
                  {r.productHandle} · {r.status}
                  {r.verified ? " · verified" : ""}
                </p>
                {r.title ? (
                  <p className="mt-2 text-sm font-medium">{r.title}</p>
                ) : null}
                <p className="mt-1 text-sm text-[#4a4a4a]">{r.body}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {r.status !== "published" ? (
                  <button
                    type="button"
                    className="rounded bg-[#1a1a1a] px-2 py-1 text-xs text-white"
                    onClick={() => setStatus(r._id, "published")}
                  >
                    Publish
                  </button>
                ) : null}
                {r.status !== "hidden" ? (
                  <button
                    type="button"
                    className="rounded border px-2 py-1 text-xs"
                    onClick={() => setStatus(r._id, "hidden")}
                  >
                    Hide
                  </button>
                ) : null}
                <button
                  type="button"
                  className="rounded border border-red-200 px-2 py-1 text-xs text-red-700"
                  onClick={() => remove(r._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 ? (
          <p className="text-sm text-[#6d7175]">
            No reviews yet. Seed the catalog to load sample product reviews.
          </p>
        ) : null}
      </div>
    </AdminShell>
  );
}
