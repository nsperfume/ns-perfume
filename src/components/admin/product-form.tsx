"use client";

import { useState } from "react";
import type { StoreProduct } from "@/lib/mappers";
import { AdminImageField } from "@/components/admin/image-field";
import { Select } from "@/components/ui/select";

type Props = {
  initial: StoreProduct | null;
  isNew: boolean;
  onSaved: () => void;
};

const empty = {
  handle: "",
  name: "",
  descriptor: "",
  concentration: "EDP",
  family: "fresh",
  gender: "unisex",
  prices: [{ ml: 50, price: 15000, sku: "" }],
  topNotes: [] as string[],
  heartNotes: [] as string[],
  baseNotes: [] as string[],
  sillage: 3,
  longevity: 3,
  ingredients: [] as string[],
  countryOfOrigin: "—",
  story: "",
  howToWear: "",
  tags: [] as string[],
  badges: [] as string[],
  imagePrimary: "",
  imageSecondary: "",
  gallery: [] as string[],
  relatedHandles: [] as string[],
  inStock: true,
  status: "active",
};

export function ProductForm({ initial, isNew, onSaved }: Props) {
  const [form, setForm] = useState(() => {
    if (!initial) return empty;
    return {
      handle: initial.handle,
      name: initial.name,
      descriptor: initial.descriptor,
      concentration: initial.concentration,
      family: initial.family,
      gender: initial.gender,
      prices: initial.prices,
      topNotes: initial.topNotes,
      heartNotes: initial.heartNotes,
      baseNotes: initial.baseNotes,
      sillage: initial.sillage,
      longevity: initial.longevity,
      ingredients: initial.ingredients,
      countryOfOrigin: initial.countryOfOrigin,
      story: initial.story,
      howToWear: initial.howToWear,
      tags: initial.tags,
      badges: initial.badges,
      imagePrimary: initial.imagePrimary,
      imageSecondary: initial.imageSecondary,
      gallery: initial.gallery,
      relatedHandles: initial.relatedHandles,
      inStock: initial.inStock,
      status: initial.status || "active",
    };
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function setField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      handle: form.handle,
      name: form.name,
      descriptor: form.descriptor,
      concentration: form.concentration,
      family: form.family,
      gender: form.gender,
      sizes: form.prices.map((p) => ({
        ml: p.ml,
        pricePkr: p.price,
        sku: p.sku || `NS-${form.handle}-${p.ml}`.toUpperCase(),
      })),
      topNotes: form.topNotes,
      heartNotes: form.heartNotes,
      baseNotes: form.baseNotes,
      sillage: form.sillage,
      longevity: form.longevity,
      ingredients: form.ingredients,
      countryOfOrigin: form.countryOfOrigin,
      story: form.story,
      howToWear: form.howToWear,
      tags: form.tags,
      badges: form.badges,
      imagePrimary: form.imagePrimary,
      imageSecondary: form.imageSecondary,
      gallery: form.gallery.length
        ? form.gallery
        : [form.imagePrimary, form.imageSecondary].filter(Boolean),
      relatedHandles: form.relatedHandles,
      inStock: form.inStock,
      status: form.status,
    };

    const res = await fetch(
      isNew ? "/api/products" : `/api/products/${form.handle}`,
      {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const json = await res.json();
    setSaving(false);
    if (!json.ok) {
      setError(json.error || "Save failed");
      return;
    }
    onSaved();
  }

  async function remove() {
    if (!confirm("Delete this product?")) return;
    const res = await fetch(`/api/products/${form.handle}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (json.ok) onSaved();
    else setError(json.error);
  }

  function setGalleryItem(index: number, url: string) {
    const next = [...form.gallery];
    if (!url.trim()) {
      next.splice(index, 1);
    } else {
      next[index] = url.trim();
    }
    setField("gallery", next.filter(Boolean));
  }

  function addGallerySlot() {
    setField("gallery", [...form.gallery, ""]);
  }

  const field =
    "mt-1 w-full rounded-lg border border-[#c9cccf] px-3 py-2 text-sm outline-none focus:border-[#A9873C]";
  const label = "block text-sm font-medium text-[#303030]";

  return (
    <form onSubmit={save} className="max-w-3xl space-y-6">
      <section className="rounded-xl border border-[#e1e3e5] bg-white p-6">
        <h2 className="text-base font-semibold">Title</h2>
        <label className={`${label} mt-4`}>
          Name
          <input
            className={field}
            required
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
          />
        </label>
        <label className={`${label} mt-4`}>
          Handle (URL)
          <input
            className={field}
            required
            disabled={!isNew}
            value={form.handle}
            onChange={(e) =>
              setField(
                "handle",
                e.target.value.toLowerCase().replace(/\s+/g, "-"),
              )
            }
          />
        </label>
        <label className={`${label} mt-4`}>
          Short descriptor
          <input
            className={field}
            value={form.descriptor}
            onChange={(e) => setField("descriptor", e.target.value)}
          />
        </label>
        <label className={`${label} mt-4`}>
          Story
          <textarea
            className={field}
            rows={4}
            value={form.story}
            onChange={(e) => setField("story", e.target.value)}
          />
        </label>
      </section>

      <section className="rounded-xl border border-[#e1e3e5] bg-white p-6">
        <h2 className="text-base font-semibold">Media</h2>
        <p className="mt-1 text-sm text-[#6d7175]">
          Upload a file (Cloudinary) or paste an image link. Preview updates as
          soon as a valid source is set.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <AdminImageField
            label="Primary image"
            hint="Product card and PDP hero"
            value={form.imagePrimary}
            onChange={(url) => setField("imagePrimary", url)}
          />
          <AdminImageField
            label="Hover / secondary"
            hint="Swap image on product card hover"
            value={form.imageSecondary}
            onChange={(url) => setField("imageSecondary", url)}
          />
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#202223]">Gallery</p>
              <p className="text-xs text-[#6d7175]">
                Extra PDP images. Leave empty to use primary + secondary only.
              </p>
            </div>
            <button
              type="button"
              onClick={addGallerySlot}
              className="rounded-lg border border-[#c9cccf] bg-white px-3 py-1.5 text-xs font-medium text-[#202223] hover:border-[#A9873C]"
            >
              + Add image
            </button>
          </div>
          {form.gallery.length ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {form.gallery.map((url, i) => (
                <AdminImageField
                  key={`gallery-${i}`}
                  label={`Gallery ${i + 1}`}
                  value={url}
                  onChange={(next) => setGalleryItem(i, next)}
                />
              ))}
            </div>
          ) : (
            <p className="mt-3 text-xs text-[#6d7175]">No gallery slots yet.</p>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-[#e1e3e5] bg-white p-6">
        <h2 className="text-base font-semibold">Pricing (PKR base)</h2>
        {form.prices.map((size, i) => (
          <div key={i} className="mt-3 grid grid-cols-3 gap-3">
            <label className={label}>
              ML
              <input
                type="number"
                className={field}
                value={size.ml}
                onChange={(e) => {
                  const prices = [...form.prices];
                  prices[i] = { ...size, ml: Number(e.target.value) };
                  setField("prices", prices);
                }}
              />
            </label>
            <label className={label}>
              Price PKR
              <input
                type="number"
                className={field}
                value={size.price}
                onChange={(e) => {
                  const prices = [...form.prices];
                  prices[i] = { ...size, price: Number(e.target.value) };
                  setField("prices", prices);
                }}
              />
            </label>
            <label className={label}>
              SKU
              <input
                className={field}
                value={size.sku}
                onChange={(e) => {
                  const prices = [...form.prices];
                  prices[i] = { ...size, sku: e.target.value };
                  setField("prices", prices);
                }}
              />
            </label>
          </div>
        ))}
        <button
          type="button"
          className="mt-3 text-sm text-[#005bd3]"
          onClick={() =>
            setField("prices", [
              ...form.prices,
              { ml: 100, price: 20000, sku: "" },
            ])
          }
        >
          + Add size
        </button>
      </section>

      <section className="rounded-xl border border-[#e1e3e5] bg-white p-6">
        <h2 className="text-base font-semibold">Organization</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Select
            label="Concentration"
            value={form.concentration}
            onValueChange={(v) => setField("concentration", v)}
            options={[
              { value: "EDP", label: "EDP" },
              { value: "EDT", label: "EDT" },
              { value: "PARFUM", label: "PARFUM" },
            ]}
          />
          <label className={label}>
            Family
            <input
              className={field}
              value={form.family}
              onChange={(e) => setField("family", e.target.value)}
            />
          </label>
          <Select
            label="Gender"
            value={form.gender}
            onValueChange={(v) => setField("gender", v)}
            options={[
              { value: "her", label: "her" },
              { value: "him", label: "him" },
              { value: "unisex", label: "unisex" },
            ]}
          />
        </div>
        <label className={`${label} mt-4`}>
          Top notes (comma-separated)
          <input
            className={field}
            value={form.topNotes.join(", ")}
            onChange={(e) =>
              setField(
                "topNotes",
                e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
              )
            }
          />
        </label>
        <label className={`${label} mt-4`}>
          Heart notes
          <input
            className={field}
            value={form.heartNotes.join(", ")}
            onChange={(e) =>
              setField(
                "heartNotes",
                e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
              )
            }
          />
        </label>
        <label className={`${label} mt-4`}>
          Base notes
          <input
            className={field}
            value={form.baseNotes.join(", ")}
            onChange={(e) =>
              setField(
                "baseNotes",
                e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
              )
            }
          />
        </label>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <label className={label}>
            Sillage (1–5)
            <input
              type="number"
              min={1}
              max={5}
              className={field}
              value={form.sillage}
              onChange={(e) => setField("sillage", Number(e.target.value))}
            />
          </label>
          <label className={label}>
            Longevity (1–5)
            <input
              type="number"
              min={1}
              max={5}
              className={field}
              value={form.longevity}
              onChange={(e) => setField("longevity", Number(e.target.value))}
            />
          </label>
        </div>
        <div className="mt-4">
          <Select
            label="Status"
            value={form.status}
            onValueChange={(v) => setField("status", v)}
            options={[
              { value: "active", label: "active" },
              { value: "draft", label: "draft" },
              { value: "archived", label: "archived" },
            ]}
          />
        </div>
      </section>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[#1a1a1a] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save product"}
        </button>
        {!isNew ? (
          <button
            type="button"
            onClick={remove}
            className="rounded-lg border border-red-200 px-5 py-2.5 text-sm text-red-700"
          >
            Delete
          </button>
        ) : null}
      </div>
    </form>
  );
}
