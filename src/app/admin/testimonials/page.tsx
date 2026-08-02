"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";

type T = {
  _id: string;
  author: string;
  city?: string;
  quote: string;
  rating?: number;
  productName?: string;
  status?: string;
};

export default function AdminTestimonialsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(null);
  const [items, setItems] = useState<T[]>([]);
  const [form, setForm] = useState({
    author: "",
    city: "Karachi",
    quote: "",
    productName: "",
    rating: 5,
  });

  function load() {
    fetch("/api/testimonials?all=1")
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

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/testimonials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, featured: true, status: "published" }),
    });
    const json = await res.json();
    if (json.ok) {
      setForm({
        author: "",
        city: "Karachi",
        quote: "",
        productName: "",
        rating: 5,
      });
      load();
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete testimonial?")) return;
    await fetch(`/api/testimonials/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <AdminShell user={user}>
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">Testimonials</h1>
      <p className="mb-6 text-sm text-[#6d7175]">
        Homepage / brand stories with Pakistani customers. Not the same as product
        reviews.
      </p>
      <form
        onSubmit={create}
        className="mb-8 grid max-w-2xl gap-3 rounded-xl border border-[#e1e3e5] bg-white p-6"
      >
        <input
          required
          placeholder="Author name"
          className="rounded-lg border border-[#c9cccf] px-3 py-2 text-sm"
          value={form.author}
          onChange={(e) => setForm({ ...form, author: e.target.value })}
        />
        <input
          placeholder="City"
          className="rounded-lg border border-[#c9cccf] px-3 py-2 text-sm"
          value={form.city}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
        />
        <input
          placeholder="Product mentioned"
          className="rounded-lg border border-[#c9cccf] px-3 py-2 text-sm"
          value={form.productName}
          onChange={(e) => setForm({ ...form, productName: e.target.value })}
        />
        <textarea
          required
          placeholder="Quote"
          rows={3}
          className="rounded-lg border border-[#c9cccf] px-3 py-2 text-sm"
          value={form.quote}
          onChange={(e) => setForm({ ...form, quote: e.target.value })}
        />
        <button
          type="submit"
          className="rounded-lg bg-[#1a1a1a] px-4 py-2 text-sm font-medium text-white"
        >
          Add testimonial
        </button>
      </form>
      <ul className="space-y-3">
        {items.map((t) => (
          <li
            key={t._id}
            className="rounded-xl border border-[#e1e3e5] bg-white p-4"
          >
            <div className="flex justify-between gap-3">
              <div>
                <p className="font-medium">
                  {t.author}
                  {t.city ? ` · ${t.city}` : ""}
                </p>
                <p className="mt-2 text-sm text-[#4a4a4a]">“{t.quote}”</p>
                {t.productName ? (
                  <p className="mt-1 text-xs text-[#6d7175]">{t.productName}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => remove(t._id)}
                className="text-xs text-red-600"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </AdminShell>
  );
}
