"use client";

import { useEffect, useState } from "react";
import type { StoreProduct } from "@/lib/mappers";
import { AdminImageField } from "@/components/admin/image-field";
import { AdminRichTextEditor } from "@/components/admin/rich-text-editor";
import {
  AdminFieldLabel,
  AdminFormSection,
  adminFieldClass,
} from "@/components/admin/form-section";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/cn";
import { sanitizeRichHtml, toRichHtml } from "@/lib/rich-text";

type Props = {
  initial: StoreProduct | null;
  isNew: boolean;
  onSaved: () => void;
  canDelete?: boolean;
};

type CollectionOption = {
  handle: string;
  title: string;
  status?: string;
};

const SCENT_FAMILIES = [
  { value: "fresh", label: "Fresh" },
  { value: "floral", label: "Floral" },
  { value: "woody", label: "Woody" },
  { value: "oriental", label: "Oriental" },
  { value: "gourmand", label: "Gourmand" },
  { value: "citrus", label: "Citrus" },
  { value: "aromatic", label: "Aromatic" },
] as const;

const empty = {
  handle: "",
  name: "",
  descriptor: "",
  description: "",
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
  containsAlcohol: true,
  countryOfOrigin: "—",
  story: "",
  howToWear: "",
  tags: [] as string[],
  collectionHandles: [] as string[],
  badges: [] as string[],
  gallery: [] as string[],
  relatedHandles: [] as string[],
  inStock: true,
  status: "active",
};

function initialGallery(product: StoreProduct) {
  if (product.gallery?.length) return [...product.gallery];
  return [product.imagePrimary, product.imageSecondary].filter(Boolean);
}

function familyOptions(current: string) {
  const list: { value: string; label: string }[] = SCENT_FAMILIES.map((f) => ({
    value: f.value,
    label: f.label,
  }));
  if (current && !list.some((f) => f.value === current)) {
    list.unshift({
      value: current,
      label: current.charAt(0).toUpperCase() + current.slice(1),
    });
  }
  return list;
}

function parseNotes(value: string) {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Drop alcohol carrier lines when marking a bottle alcohol-free. */
function withoutAlcoholIngredients(list: string[]) {
  return list.filter((item) => !/alcohol/i.test(item));
}

function buildTags(form: {
  gender: string;
  family: string;
  concentration: string;
  badges: string[];
  tags: string[];
}) {
  const auto = [
    `gender:${form.gender}`,
    `family:${form.family}`,
    `concentration:${form.concentration.toLowerCase()}`,
    ...form.badges.map((b) => `badge:${b}`),
  ];
  const keep = form.tags.filter(
    (t) =>
      !t.startsWith("gender:") &&
      !t.startsWith("family:") &&
      !t.startsWith("concentration:") &&
      !t.startsWith("badge:"),
  );
  return Array.from(new Set([...auto, ...keep]));
}

const selectTrigger =
  "border-admin-input-border! bg-admin-soft-2! text-admin-ink! hover:border-brass! data-[state=open]:border-brass!";
const selectClass =
  "[&_label]:text-[13px]! [&_label]:font-semibold! [&_label]:text-admin-ink!";

export function ProductForm({
  initial,
  isNew,
  onSaved,
  canDelete = false,
}: Props) {
  const [form, setForm] = useState(() => {
    if (!initial) return empty;
    return {
      handle: initial.handle,
      name: initial.name,
      descriptor: initial.descriptor,
      description: toRichHtml(initial.description || ""),
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
      containsAlcohol: initial.containsAlcohol !== false,
      countryOfOrigin: initial.countryOfOrigin,
      story: toRichHtml(initial.story),
      howToWear: toRichHtml(initial.howToWear),
      tags: initial.tags,
      collectionHandles: initial.collectionHandles || [],
      badges: initial.badges,
      gallery: initialGallery(initial),
      relatedHandles: initial.relatedHandles,
      inStock: initial.inStock,
      status: initial.status || "active",
    };
  });
  const [collections, setCollections] = useState<CollectionOption[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/collections?all=1")
      .then((r) => r.json())
      .then((j) => {
        if (!j.ok || !Array.isArray(j.data)) return;
        setCollections(
          j.data.map(
            (c: { handle: string; title: string; status?: string }) => ({
              handle: c.handle,
              title: c.title,
              status: c.status,
            }),
          ),
        );
      })
      .catch(() => {
        /* ignore */
      });
  }, []);

  function setField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleCollection(handle: string) {
    setForm((f) => {
      const has = f.collectionHandles.includes(handle);
      return {
        ...f,
        collectionHandles: has
          ? f.collectionHandles.filter((h) => h !== handle)
          : [...f.collectionHandles, handle],
      };
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const gallery = form.gallery.map((u) => u.trim()).filter(Boolean);
    if (!gallery.length) {
      setSaving(false);
      setError("Add at least one gallery image (first image is the product card).");
      return;
    }

    const payload = {
      handle: form.handle,
      name: form.name,
      descriptor: form.descriptor,
      description: sanitizeRichHtml(toRichHtml(form.description)),
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
      ingredients: form.containsAlcohol
        ? form.ingredients
        : withoutAlcoholIngredients(form.ingredients),
      containsAlcohol: form.containsAlcohol,
      countryOfOrigin: form.countryOfOrigin,
      story: sanitizeRichHtml(toRichHtml(form.story)),
      howToWear: sanitizeRichHtml(toRichHtml(form.howToWear)),
      tags: buildTags(form),
      collectionHandles: form.collectionHandles,
      badges: form.badges,
      // First gallery image = card/hero primary; second = hover.
      imagePrimary: gallery[0],
      imageSecondary: gallery[1] || gallery[0],
      gallery,
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
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/products/${form.handle}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.ok) {
        setDeleteOpen(false);
        onSaved();
      } else {
        setError(json.error || "Delete failed");
      }
    } catch {
      setError("Network error while deleting");
    } finally {
      setDeleting(false);
    }
  }

  function setGalleryItem(index: number, url: string) {
    const next = [...form.gallery];
    if (!url.trim()) next.splice(index, 1);
    else next[index] = url.trim();
    setField("gallery", next.filter(Boolean));
  }

  function removeSize(index: number) {
    if (form.prices.length <= 1) return;
    setField(
      "prices",
      form.prices.filter((_, i) => i !== index),
    );
  }

  function removeGallerySlot(index: number) {
    setField(
      "gallery",
      form.gallery.filter((_, i) => i !== index),
    );
  }

  return (
    <form onSubmit={save} className="w-full max-w-none">
      <div className="grid gap-5 pb-4 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,22rem)] lg:items-start xl:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
        {/* Left: Basics, Images, Story, Sizes */}
        <div className="min-w-0 space-y-5">
          <AdminFormSection
            title="Basics"
            description="Name and URL customers see on the product page."
            tip="The handle becomes /products/your-handle. Keep it short and stable. Once created, the handle cannot change."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <AdminFieldLabel
                  tip="Shown as the main product title on the storefront."
                  required
                >
                  Product name
                </AdminFieldLabel>
                <input
                  className={adminFieldClass}
                  required
                  value={form.name}
                  onChange={(e) => {
                    setField("name", e.target.value);
                    if (isNew) {
                      setField(
                        "handle",
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, "-")
                          .replace(/^-|-$/g, ""),
                      );
                    }
                  }}
                  placeholder="e.g. Amber Noir"
                />
              </div>
              <div>
                <AdminFieldLabel
                  tip="URL slug only: lowercase letters, numbers, hyphens. Locked after create."
                  required
                >
                  Handle (URL)
                </AdminFieldLabel>
                <input
                  className={adminFieldClass}
                  required
                  disabled={!isNew}
                  value={form.handle}
                  onChange={(e) =>
                    setField(
                      "handle",
                      e.target.value.toLowerCase().replace(/\s+/g, "-"),
                    )
                  }
                  placeholder="amber-noir"
                />
              </div>
              <div>
                <AdminFieldLabel tip="One short line under the title on product cards.">
                  Short descriptor
                </AdminFieldLabel>
                <input
                  className={adminFieldClass}
                  value={form.descriptor}
                  onChange={(e) => setField("descriptor", e.target.value)}
                  placeholder="Warm amber with a cedar trail"
                />
              </div>
              <div className="sm:col-span-2">
                <AdminRichTextEditor
                  label="Product description"
                  tip="Shown in the buy column on the product page, under the short descriptor."
                  value={form.description}
                  minHeightClass="min-h-32"
                  placeholder="What it smells like, when it suits, and how it wears."
                  onChange={(description) => setField("description", description)}
                />
              </div>
            </div>
          </AdminFormSection>

          <AdminFormSection
            title="Images"
            description="Gallery only. The first image is the card and hero. The second is the card hover."
            tip="Drop a file, click to upload, or paste a URL under each slot. Add at least one image."
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <p className="font-display text-base font-semibold text-admin-ink">
                  Gallery
                </p>
                <p className="text-[13px] text-admin-muted">
                  1st = primary · 2nd = hover · rest = product page
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setField("gallery", [...form.gallery, ""])}
                className="h-9! min-h-9! w-auto! px-3! text-sm"
              >
                + Add
              </Button>
            </div>
            {form.gallery.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {form.gallery.map((url, i) => (
                  <AdminImageField
                    key={`gallery-${i}-${url || "empty"}`}
                    label={
                      i === 0
                        ? "1 · Primary"
                        : i === 1
                          ? "2 · Hover"
                          : `Gallery ${i + 1}`
                    }
                    hint={
                      i === 0
                        ? "Card and product hero"
                        : i === 1
                          ? "Shown on product card hover"
                          : undefined
                    }
                    density="compact"
                    aspect="square"
                    value={url}
                    onChange={(next) => setGalleryItem(i, next)}
                    onRemoveSlot={() => removeGallerySlot(i)}
                  />
                ))}
              </div>
            ) : (
              <p className="rounded-md border border-dashed border-admin-line bg-admin-soft-2 px-3 py-4 text-center text-sm text-admin-muted">
                Add a gallery image to publish this bottle.
              </p>
            )}
          </AdminFormSection>

          <AdminFormSection
            title="Story"
            description="Longer copy for people who scroll the product page."
            tip="Aim for at least a short paragraph. This helps SEO and sets expectations for wear."
          >
            <AdminRichTextEditor
              label="Product story"
              tip="What it smells like, when to wear it, who it suits."
              value={form.story}
              minHeightClass="min-h-40"
              placeholder="Opens with… settles into…"
              onChange={(story) => setField("story", story)}
            />
            <AdminRichTextEditor
              label="How to wear"
              tip="Optional. Practical guidance shown near purchase."
              value={form.howToWear}
              minHeightClass="min-h-28"
              placeholder="Two sprays on pulse points for evening…"
              onChange={(howToWear) => setField("howToWear", howToWear)}
            />
          </AdminFormSection>

          <AdminFormSection
            title="Sizes and pricing"
            description="All amounts in PKR. Storefront converts for other currencies."
            tip="Add one row per bottle size. SKU can be left blank to auto-generate."
          >
            {form.prices.map((size, i) => (
              <div
                key={i}
                className="rounded-md border border-admin-line bg-admin-soft-2 p-3"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="font-display text-sm font-semibold text-admin-ink">
                    Size {i + 1}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeSize(i)}
                    disabled={form.prices.length <= 1}
                    title={
                      form.prices.length <= 1
                        ? "At least one size is required"
                        : "Remove this size"
                    }
                    className={cn(
                      "cursor-pointer font-display text-[11px] font-medium uppercase tracking-wide transition-colors",
                      form.prices.length <= 1
                        ? "cursor-not-allowed text-admin-faint opacity-50"
                        : "text-admin-muted hover:text-rosewood",
                    )}
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <AdminFieldLabel tip="Bottle size in millilitres.">
                      ML
                    </AdminFieldLabel>
                    <input
                      type="number"
                      className={adminFieldClass}
                      value={size.ml}
                      onChange={(e) => {
                        const prices = [...form.prices];
                        prices[i] = { ...size, ml: Number(e.target.value) };
                        setField("prices", prices);
                      }}
                    />
                  </div>
                  <div>
                    <AdminFieldLabel tip="Base price in Pakistani rupees.">
                      Price (PKR)
                    </AdminFieldLabel>
                    <input
                      type="number"
                      className={adminFieldClass}
                      value={size.price}
                      onChange={(e) => {
                        const prices = [...form.prices];
                        prices[i] = { ...size, price: Number(e.target.value) };
                        setField("prices", prices);
                      }}
                    />
                  </div>
                  <div>
                    <AdminFieldLabel tip="Inventory code. Auto-built if empty.">
                      SKU
                    </AdminFieldLabel>
                    <input
                      className={adminFieldClass}
                      value={size.sku}
                      onChange={(e) => {
                        const prices = [...form.prices];
                        prices[i] = { ...size, sku: e.target.value };
                        setField("prices", prices);
                      }}
                      placeholder="Auto"
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                setField("prices", [
                  ...form.prices,
                  { ml: 100, price: 20000, sku: "" },
                ])
              }
              className="sm:w-auto"
            >
              + Add size
            </Button>
          </AdminFormSection>
        </div>

        {/* Right: Publish, Categories, Scent profile */}
        <div className="min-w-0 space-y-5 lg:sticky lg:top-4 lg:self-start">
          <AdminFormSection
            title="Publish"
            description="Visibility and stock on the storefront."
          >
            <Select
              label="Visibility"
              value={form.status}
              onValueChange={(v) => setField("status", v)}
              options={[
                { value: "active", label: "Published" },
                { value: "draft", label: "Draft (hidden)" },
                { value: "archived", label: "Archived" },
              ]}
              triggerClassName={selectTrigger}
              className={selectClass}
            />
            <div>
              <AdminFieldLabel tip="Uncheck to show Out of stock on the storefront.">
                Stock
              </AdminFieldLabel>
              <label className="mt-1 flex min-h-12 cursor-pointer items-center gap-2.5 rounded-md border border-admin-input-border bg-admin-soft-2 px-3.5 text-base text-admin-ink">
                <input
                  type="checkbox"
                  checked={form.inStock}
                  onChange={(e) => setField("inStock", e.target.checked)}
                  className="h-4 w-4 accent-brass"
                />
                In stock and sellable
              </label>
            </div>
          </AdminFormSection>

          <AdminFormSection
            title="Categories"
            description="Collections this bottle appears in on the storefront."
            tip="Tick any collection. Gender and family collections also pick products up from scent profile tags."
          >
            {collections.length === 0 ? (
              <p className="text-sm text-admin-muted">
                No collections yet. Create one under Collections first.
              </p>
            ) : (
              <ul className="max-h-[16rem] space-y-1 overflow-y-auto pr-1">
                {collections.map((c) => {
                  const checked = form.collectionHandles.includes(c.handle);
                  return (
                    <li key={c.handle}>
                      <label
                        className={cn(
                          "flex cursor-pointer items-start gap-2.5 rounded-md border px-3 py-2.5 text-[15px] transition-colors",
                          checked
                            ? "border-admin-ink bg-admin-soft"
                            : "border-admin-line bg-admin-soft-2 hover:border-admin-muted",
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCollection(c.handle)}
                          className="mt-0.5 h-4 w-4 shrink-0 accent-brass"
                        />
                        <span className="min-w-0">
                          <span className="block font-medium text-admin-ink">
                            {c.title}
                          </span>
                          <span className="block font-mono text-xs text-admin-faint">
                            /collections/{c.handle}
                            {c.status === "draft" ? " · draft" : ""}
                          </span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
            {form.collectionHandles.length > 0 ? (
              <p className="text-[13px] text-admin-muted">
                {form.collectionHandles.length} selected
              </p>
            ) : null}
          </AdminFormSection>

          <AdminFormSection
            title="Scent profile"
            description="How we filter and describe the bottle."
            tip="Family and gender also feed collection filters on the storefront."
          >
            <Select
              label="Concentration"
              value={form.concentration}
              onValueChange={(v) => setField("concentration", v)}
              options={[
                { value: "EDP", label: "EDP" },
                { value: "EDT", label: "EDT" },
                { value: "PARFUM", label: "PARFUM" },
              ]}
              triggerClassName={selectTrigger}
              className={selectClass}
            />
            <Select
              label="Family"
              value={form.family}
              onValueChange={(v) => setField("family", v)}
              options={familyOptions(form.family)}
              triggerClassName={selectTrigger}
              className={selectClass}
            />
            <Select
              label="Gender"
              value={form.gender}
              onValueChange={(v) => setField("gender", v)}
              options={[
                { value: "her", label: "Her" },
                { value: "him", label: "Him" },
                { value: "unisex", label: "Unisex" },
              ]}
              triggerClassName={selectTrigger}
              className={selectClass}
            />
            <div>
              <AdminFieldLabel tip="First impression notes. Comma-separated.">
                Top notes
              </AdminFieldLabel>
              <input
                className={adminFieldClass}
                value={form.topNotes.join(", ")}
                onChange={(e) =>
                  setField("topNotes", parseNotes(e.target.value))
                }
                placeholder="Bergamot, Pink pepper"
              />
            </div>
            <div>
              <AdminFieldLabel tip="Heart of the fragrance after the open softens.">
                Heart notes
              </AdminFieldLabel>
              <input
                className={adminFieldClass}
                value={form.heartNotes.join(", ")}
                onChange={(e) =>
                  setField("heartNotes", parseNotes(e.target.value))
                }
                placeholder="Rose, Iris"
              />
            </div>
            <div>
              <AdminFieldLabel tip="Drydown that lingers.">
                Base notes
              </AdminFieldLabel>
              <input
                className={adminFieldClass}
                value={form.baseNotes.join(", ")}
                onChange={(e) =>
                  setField("baseNotes", parseNotes(e.target.value))
                }
                placeholder="Amber, Cedar, Musk"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <AdminFieldLabel tip="How far the scent projects (1 soft, 5 room-filling).">
                  Sillage (1-5)
                </AdminFieldLabel>
                <input
                  type="number"
                  min={1}
                  max={5}
                  className={adminFieldClass}
                  value={form.sillage}
                  onChange={(e) => setField("sillage", Number(e.target.value))}
                />
              </div>
              <div>
                <AdminFieldLabel tip="How long it tends to last on skin (1 short, 5 all day).">
                  Longevity (1-5)
                </AdminFieldLabel>
                <input
                  type="number"
                  min={1}
                  max={5}
                  className={adminFieldClass}
                  value={form.longevity}
                  onChange={(e) =>
                    setField("longevity", Number(e.target.value))
                  }
                />
              </div>
            </div>
            <div>
              <AdminFieldLabel tip="Shown on the product page. Leave blank if you do not want an ingredients list.">
                Ingredients
              </AdminFieldLabel>
              <input
                className={adminFieldClass}
                value={form.ingredients.join(", ")}
                onChange={(e) =>
                  setField("ingredients", parseNotes(e.target.value))
                }
                placeholder={
                  form.containsAlcohol
                    ? "Alcohol denat., Parfum, Linalool"
                    : "Parfum, Essential oils, Carrier oil"
                }
              />
            </div>
            <div>
              <AdminFieldLabel tip="Uncheck for oil or attar formulas with no alcohol carrier. Storefront will label them alcohol-free.">
                Alcohol
              </AdminFieldLabel>
              <label className="mt-1 flex min-h-12 cursor-pointer items-center gap-2.5 rounded-md border border-admin-input-border bg-admin-soft-2 px-3.5 text-base text-admin-ink">
                <input
                  type="checkbox"
                  checked={form.containsAlcohol}
                  onChange={(e) => {
                    const next = e.target.checked;
                    setForm((f) => ({
                      ...f,
                      containsAlcohol: next,
                      ingredients: next
                        ? f.ingredients
                        : withoutAlcoholIngredients(f.ingredients),
                    }));
                  }}
                  className="h-4 w-4 accent-brass"
                />
                Formula contains alcohol
              </label>
            </div>
            <div>
              <AdminFieldLabel tip="Country shown under ingredients and specs.">
                Country of origin
              </AdminFieldLabel>
              <input
                className={adminFieldClass}
                value={form.countryOfOrigin}
                onChange={(e) => setField("countryOfOrigin", e.target.value)}
                placeholder="Pakistan"
              />
            </div>
          </AdminFormSection>
        </div>
      </div>

      {error ? (
        <p className="mb-3 text-base text-rosewood">{error}</p>
      ) : null}

      <div className="sticky bottom-0 z-10 -mx-1 border-t border-admin-line bg-admin-page/95 px-1 py-3 backdrop-blur-sm supports-backdrop-filter:bg-admin-page/85">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[15px] text-admin-muted">
            {form.status === "active"
              ? "Will be live when saved."
              : form.status === "draft"
                ? "Draft stays hidden from the storefront."
                : "Archived and not listed for sale."}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={saving || deleting}>
              {saving ? "Saving…" : "Save product"}
            </Button>
            {!isNew && canDelete ? (
              <Button
                type="button"
                variant="danger"
                disabled={saving || deleting}
                onClick={() => setDeleteOpen(true)}
              >
                Delete
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this product?"
        description={`${form.name || "This product"} will be removed from the storefront and admin. This cannot be undone.`}
        confirmLabel="Delete product"
        cancelLabel="Keep product"
        loading={deleting}
        onConfirm={remove}
      />
    </form>
  );
}
