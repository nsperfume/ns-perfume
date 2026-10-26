"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import slugify from "slugify";
import { z } from "zod";
import { XIcon } from "@animateicons/react/lucide";
import type { StoreProduct } from "@/lib/mappers";
import { AdminImageField } from "@/components/admin/image-field";
import { AdminRichTextEditor } from "@/components/admin/rich-text-editor";
import {
  AdminFieldLabel,
  AdminFormSection,
  adminFieldClass,
} from "@/components/admin/form-section";
import { Select } from "@/components/admin/select";
import { Button } from "@/components/admin/button";
import { AdminIconAction } from "@/components/admin/ui";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { toast } from "@/components/admin/toast";
import {
  AdminFieldError,
  AdminFormError,
  focusFirstError,
  useFormValidation,
  type FieldErrors,
} from "@/components/admin/form-validation";
import { useUnsavedChangesGuard } from "@/components/admin/unsaved-changes";
import { cn } from "@/lib/cn";
import { sanitizeRichHtml, toRichHtml } from "@/lib/rich-text";

type Props = {
  initial: StoreProduct | null;
  isNew: boolean;
  /** Called after a successful save or delete with the saved product (null after delete). */
  onSaved: (product: StoreProduct | null, meta: { created: boolean; deleted: boolean }) => void;
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

/** ml / price are NaN while the field is empty so validation can flag it. */
type SizeRow = { ml: number; price: number; sku: string; compareAt?: number };

/* Mirrors src/lib/validation/catalog.ts (not imported: it pulls server code). */
const HANDLE_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_NOTES = 12;
const MAX_INGREDIENTS = 60;
const MAX_IMAGES = 12;
const MAX_SIZES = 8;

const sizeRule = z
  .object({
    ml: z
      .number({ error: "Enter the size in ml" })
      .int("Use whole millilitres")
      .min(1, "Enter the size in ml")
      .max(1000, "Use 1000 ml or less"),
    price: z
      .number({ error: "Enter a price" })
      .int("Use a whole rupee amount")
      .min(1, "Enter a price above zero")
      .max(10_000_000, "Price is too high"),
    compareAt: z.number().optional(),
  })
  .superRefine((s, ctx) => {
    if (s.compareAt != null && Number.isFinite(s.compareAt) && s.compareAt > 0) {
      if (Number.isFinite(s.price) && s.compareAt <= s.price) {
        ctx.addIssue({
          code: "custom",
          path: ["compareAt"],
          message: "Must be higher than the price",
        });
      }
    }
  });

const productSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Enter the product name")
      .min(2, "Use at least 2 characters")
      .max(80, "Keep the name under 80 characters"),
    handle: z
      .string()
      .max(80, "Keep the URL under 80 characters")
      .regex(HANDLE_RE, "Use lowercase letters, numbers and dashes"),
    descriptor: z.string().max(160, "Keep this under 160 characters"),
    countryOfOrigin: z.string().max(60, "Keep this under 60 characters"),
    prices: z
      .array(sizeRule)
      .min(1, "Add at least one size")
      .max(MAX_SIZES, `Add up to ${MAX_SIZES} sizes`),
    gallery: z.array(z.string()).max(MAX_IMAGES, `Add up to ${MAX_IMAGES} images`),
    status: z.string(),
  })
  .superRefine((f, ctx) => {
    const seen = new Set<number>();
    f.prices.forEach((p, i) => {
      if (!Number.isFinite(p.ml)) return;
      if (seen.has(p.ml)) {
        ctx.addIssue({
          code: "custom",
          path: ["prices", i, "ml"],
          message: "This size is already listed",
        });
      }
      seen.add(p.ml);
    });
    if (f.status === "active" && f.gallery.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["gallery"],
        message: "Add a main image to publish, or save as a draft",
      });
    }
  });

function toHandle(name: string) {
  return slugify(name, { lower: true, strict: true, trim: true })
    .slice(0, 80)
    .replace(/-+$/g, "");
}

function autoSku(handle: string, ml: number) {
  return `NS-${handle}-${ml}`
    .toUpperCase()
    .replace(/[^A-Z0-9._-]/g, "-")
    .slice(0, 60);
}

type FormState = {
  handle: string;
  name: string;
  descriptor: string;
  description: string;
  concentration: string;
  family: string;
  gender: string;
  prices: SizeRow[];
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  sillage: number;
  longevity: number;
  ingredients: string[];
  containsAlcohol: boolean;
  countryOfOrigin: string;
  story: string;
  howToWear: string;
  tags: string[];
  collectionHandles: string[];
  badges: string[];
  gallery: string[];
  relatedHandles: string[];
  inStock: boolean;
  status: string;
};

const EMPTY: FormState = {
  handle: "",
  name: "",
  descriptor: "",
  description: "",
  concentration: "EDP",
  family: "fresh",
  gender: "unisex",
  prices: [{ ml: 50, price: Number.NaN, sku: "" }],
  topNotes: [],
  heartNotes: [],
  baseNotes: [],
  sillage: 3,
  longevity: 3,
  ingredients: [],
  containsAlcohol: true,
  countryOfOrigin: "",
  story: "",
  howToWear: "",
  tags: [],
  collectionHandles: [],
  badges: [],
  gallery: [],
  relatedHandles: [],
  inStock: true,
  status: "draft",
};

function initialGallery(product: StoreProduct) {
  if (product.gallery?.length) return [...product.gallery];
  return [product.imagePrimary, product.imageSecondary].filter(Boolean);
}

function fromProduct(p: StoreProduct): FormState {
  return {
    handle: p.handle,
    name: p.name,
    descriptor: p.descriptor,
    description: toRichHtml(p.description || ""),
    concentration: p.concentration,
    family: p.family,
    gender: p.gender,
    prices: p.prices.map((s) => ({ ...s })),
    topNotes: [...p.topNotes],
    heartNotes: [...p.heartNotes],
    baseNotes: [...p.baseNotes],
    sillage: p.sillage,
    longevity: p.longevity,
    ingredients: [...p.ingredients],
    containsAlcohol: p.containsAlcohol !== false,
    // Older records stored a dash placeholder for "not set"
    countryOfOrigin: /^[\u2013\u2014-]$/.test(p.countryOfOrigin?.trim() || "")
      ? ""
      : p.countryOfOrigin || "",
    story: toRichHtml(p.story),
    howToWear: toRichHtml(p.howToWear),
    tags: [...p.tags],
    collectionHandles: [...(p.collectionHandles || [])],
    badges: [...p.badges],
    gallery: initialGallery(p),
    relatedHandles: [...p.relatedHandles],
    inStock: p.inStock,
    status: p.status || "active",
  };
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

/** Drop alcohol carrier lines when marking a bottle alcohol-free. */
function withoutAlcoholIngredients(list: string[]) {
  return list.filter((item) => !/alcohol/i.test(item));
}

/** Filter tags are derived from the scent profile; owners never type them. */
function buildTags(form: FormState) {
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

/** Map API field keys (sizes.0.pricePkr, imagePrimary…) onto form field keys. */
function mapServerErrors(fieldErrors: Record<string, string> | undefined) {
  const out: FieldErrors = {};
  if (!fieldErrors) return out;
  for (const [raw, message] of Object.entries(fieldErrors)) {
    let key = raw
      .replace(/^sizes\b/, "prices")
      .replace(/\.pricePkr$/, ".price")
      .replace(/\.compareAtPkr$/, ".compareAt");
    if (/^(imagePrimary|imageSecondary|gallery)/.test(key)) key = "gallery";
    if (/^prices\.\d+\.sku$/.test(key)) key = "prices";
    if (!out[key]) out[key] = message;
  }
  return out;
}

const selectLabel =
  "[&_label]:text-sm! [&_label]:font-semibold! [&_label]:text-admin-ink!";

/* ---------- small field controls ---------- */

function NumberInput({
  name,
  label,
  value,
  onChange,
  onBlur,
  prefix,
  suffix,
  placeholder,
  invalid,
}: {
  name: string;
  label: string;
  value: number | undefined;
  onChange: (n: number) => void;
  onBlur?: () => void;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  invalid?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const has = value != null && Number.isFinite(value);
  const shown = has
    ? focused
      ? String(value)
      : (value as number).toLocaleString("en-PK")
    : "";
  return (
    <div className="relative">
      {prefix ? (
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[0.9375rem] text-admin-muted">
          {prefix}
        </span>
      ) : null}
      <input
        name={name}
        aria-label={label}
        inputMode="numeric"
        autoComplete="off"
        value={shown}
        onFocus={() => setFocused(true)}
        onChange={(e) => {
          const digits = e.target.value.replace(/[^0-9]/g, "").slice(0, 8);
          onChange(digits === "" ? Number.NaN : Number(digits));
        }}
        onBlur={() => {
          setFocused(false);
          onBlur?.();
        }}
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        className={cn(
          adminFieldClass,
          "tabular-nums placeholder:font-sans",
          prefix && "pl-10",
          suffix && "pr-11",
        )}
      />
      {suffix ? (
        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[0.9375rem] text-admin-muted">
          {suffix}
        </span>
      ) : null}
    </div>
  );
}

/** Type a value and press Enter (or a comma) to add it as a chip. */
function ChipsField({
  label,
  name,
  values,
  onChange,
  placeholder,
  max,
  maxLength,
}: {
  label: string;
  name: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  max: number;
  maxLength: number;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState("");
  const full = values.length >= max;

  function add(raw: string) {
    const parts = raw
      .split(",")
      .map((s) => s.trim().slice(0, maxLength))
      .filter(Boolean);
    setDraft("");
    if (!parts.length) return;
    const next = [...values];
    for (const p of parts) {
      if (next.length >= max) break;
      if (!next.some((v) => v.toLowerCase() === p.toLowerCase())) next.push(p);
    }
    if (next.length !== values.length) onChange(next);
  }

  return (
    <div data-field={name}>
      <AdminFieldLabel htmlFor={id}>{label}</AdminFieldLabel>
      <div
        className="flex min-h-11 cursor-text flex-wrap items-center gap-1.5 rounded-md border border-admin-input-border bg-admin-soft-2 px-2 py-1.5 transition-colors focus-within:border-brass focus-within:ring-2 focus-within:ring-brass/20"
        onClick={() => inputRef.current?.focus()}
      >
        {values.map((v, i) => (
          <span
            key={`${v}-${i}`}
            className="inline-flex items-center gap-0.5 rounded-full border border-admin-line bg-admin-paper py-0.5 pl-3 pr-0.5 text-sm font-medium text-admin-ink"
          >
            {v}
            <button
              type="button"
              aria-label={`Remove ${v}`}
              onClick={(e) => {
                e.stopPropagation();
                onChange(values.filter((_, j) => j !== i));
              }}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-admin-muted hover:bg-admin-soft hover:text-admin-ink"
            >
              <XIcon size={14} color="currentColor" isAnimated={false} />
            </button>
          </span>
        ))}
        {!full ? (
          <input
            ref={inputRef}
            id={id}
            value={draft}
            onChange={(e) => {
              const v = e.target.value;
              if (v.includes(",")) add(v);
              else setDraft(v);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add(draft);
              } else if (e.key === "Backspace" && !draft && values.length) {
                onChange(values.slice(0, -1));
              }
            }}
            onBlur={() => add(draft)}
            placeholder={values.length ? "Add another" : placeholder}
            className="min-w-36 flex-1 bg-transparent px-1.5 py-1 text-base text-admin-ink outline-none placeholder:text-admin-faint"
          />
        ) : (
          <span className="px-1.5 text-sm text-admin-muted">Limit reached</span>
        )}
      </div>
    </div>
  );
}

/** 1 to 5 segmented scale with plain-language ends. */
function ScaleField({
  label,
  value,
  onChange,
  low,
  high,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  low: string;
  high: string;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-admin-ink">{label}</p>
      <div
        role="radiogroup"
        aria-label={label}
        className="grid grid-cols-5 gap-1 rounded-md border border-admin-input-border bg-admin-soft-2 p-1"
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${label} ${n} of 5`}
            onClick={() => onChange(n)}
            className={cn(
              "h-9 cursor-pointer rounded font-sans tabular-nums text-sm font-semibold transition-colors",
              value === n
                ? "bg-admin-ink text-admin-paper"
                : "text-admin-muted hover:bg-admin-soft hover:text-admin-ink",
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[0.8125rem] text-admin-muted">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}

function CheckRow({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-admin-input-border bg-admin-soft-2 px-3.5 text-[0.9375rem] font-medium text-admin-ink transition-colors hover:border-admin-muted">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4.5 w-4.5 shrink-0 cursor-pointer accent-brass"
      />
      {label}
    </label>
  );
}

/* ---------- form ---------- */

export function ProductForm({
  initial,
  isNew,
  onSaved,
  canDelete = false,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [form, setForm] = useState<FormState>(() =>
    initial ? fromProduct(initial) : EMPTY,
  );
  const [snapshot, setSnapshot] = useState(() => JSON.stringify(form));
  const [handleEdited, setHandleEdited] = useState(!isNew);
  const [urlOpen, setUrlOpen] = useState(false);
  const [collections, setCollections] = useState<CollectionOption[]>([]);
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const v = useFormValidation(productSchema);

  const dirty = JSON.stringify(form) !== snapshot;
  const leaveGuard = useUnsavedChangesGuard(dirty && !saving && !deleting);

  const validationInput = useMemo(
    () => ({
      name: form.name,
      handle: form.handle,
      descriptor: form.descriptor,
      countryOfOrigin: form.countryOfOrigin,
      prices: form.prices,
      gallery: form.gallery,
      status: form.status,
    }),
    [form],
  );

  // After the first submit attempt, errors update as fields change.
  const { submitted, revalidate } = v;
  useEffect(() => {
    if (submitted) revalidate(validationInput);
  }, [submitted, revalidate, validationInput]);

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
        /* list stays empty */
      });
  }, []);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setName(name: string) {
    setForm((f) => ({
      ...f,
      name,
      handle: isNew && !handleEdited ? toHandle(name) : f.handle,
    }));
  }

  function setSize(index: number, patch: Partial<SizeRow>) {
    setForm((f) => {
      const prices = [...f.prices];
      const row = prices[index];
      const next = { ...row, ...patch };
      // Auto SKUs follow the size; custom SKUs from older records are kept.
      if (patch.ml !== undefined && row.sku && row.sku === autoSku(f.handle, row.ml)) {
        next.sku = "";
      }
      prices[index] = next;
      return { ...f, prices };
    });
  }

  function toggleCollection(handle: string) {
    setForm((f) => ({
      ...f,
      collectionHandles: f.collectionHandles.includes(handle)
        ? f.collectionHandles.filter((h) => h !== handle)
        : [...f.collectionHandles, handle],
    }));
  }

  function setGalleryItem(index: number, url: string) {
    setForm((f) => {
      const gallery = [...f.gallery];
      if (!url.trim()) gallery.splice(index, 1);
      else gallery[index] = url.trim();
      return { ...f, gallery };
    });
  }

  function removeGalleryItem(index: number) {
    setForm((f) => ({ ...f, gallery: f.gallery.filter((_, i) => i !== index) }));
  }

  function makeMain(index: number) {
    setForm((f) => {
      const gallery = [...f.gallery];
      const [picked] = gallery.splice(index, 1);
      return { ...f, gallery: [picked, ...gallery] };
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setServerError("");
    if (!v.validate(validationInput, formRef.current)) {
      if (v.errors.handle || !HANDLE_RE.test(form.handle)) setUrlOpen(true);
      toast.error("Check the highlighted fields");
      return;
    }

    const gallery = form.gallery.map((u) => u.trim()).filter(Boolean);
    const used = new Set<string>();
    const sizes = form.prices.map((p) => {
      const base = p.sku || autoSku(form.handle, p.ml);
      let sku = base;
      let n = 2;
      while (used.has(sku.toLowerCase())) sku = `${base}-${n++}`.slice(0, 60);
      used.add(sku.toLowerCase());
      return {
        ml: p.ml,
        pricePkr: p.price,
        sku,
        // Keep the sale "was" price; omit when blank so it is cleared.
        ...(p.compareAt != null && Number.isFinite(p.compareAt) && p.compareAt > 0
          ? { compareAtPkr: p.compareAt }
          : {}),
      };
    });

    const payload = {
      handle: form.handle,
      name: form.name.trim(),
      descriptor: form.descriptor.trim(),
      description: sanitizeRichHtml(toRichHtml(form.description)),
      concentration: form.concentration,
      family: form.family,
      gender: form.gender,
      sizes,
      topNotes: form.topNotes,
      heartNotes: form.heartNotes,
      baseNotes: form.baseNotes,
      sillage: form.sillage,
      longevity: form.longevity,
      ingredients: form.containsAlcohol
        ? form.ingredients
        : withoutAlcoholIngredients(form.ingredients),
      containsAlcohol: form.containsAlcohol,
      // Same stored default as before when left blank
      countryOfOrigin: form.countryOfOrigin.trim() || "\u2014",
      story: sanitizeRichHtml(toRichHtml(form.story)),
      howToWear: sanitizeRichHtml(toRichHtml(form.howToWear)),
      tags: buildTags(form),
      collectionHandles: form.collectionHandles,
      badges: form.badges,
      // First gallery image = card/hero primary; second = hover.
      imagePrimary: gallery[0] || "",
      imageSecondary: gallery[1] || gallery[0] || "",
      gallery,
      relatedHandles: form.relatedHandles,
      inStock: form.inStock,
      status: form.status,
    };

    setSaving(true);
    try {
      const res = await fetch(
        isNew
          ? "/api/products"
          : `/api/products/${encodeURIComponent(initial?.handle || form.handle)}`,
        {
          method: isNew ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const json = (await res.json().catch(() => null)) as {
        ok?: boolean;
        data?: StoreProduct;
        error?: string;
        details?: { fieldErrors?: Record<string, string> };
      } | null;
      if (!json?.ok) {
        const message =
          json?.error ||
          (res.status === 401 || res.status === 403
            ? "Your session ended. Sign in again."
            : "Could not save the product. Try again.");
        const fieldErrors = mapServerErrors(json?.details?.fieldErrors);
        setServerError(message);
        toast.error(message);
        if (Object.keys(fieldErrors).length) {
          v.setErrors(fieldErrors);
          if (fieldErrors.handle) setUrlOpen(true);
          requestAnimationFrame(() =>
            focusFirstError(Object.keys(fieldErrors), formRef.current),
          );
        }
        return;
      }
      setSnapshot(JSON.stringify(form));
      toast.success(isNew ? "Product created" : "Product saved");
      onSaved(json.data ?? null, { created: isNew, deleted: false });
    } catch {
      const message = "Network error. Check your connection and try again.";
      setServerError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/products/${encodeURIComponent(initial?.handle || form.handle)}`,
        { method: "DELETE" },
      );
      const json = (await res.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
      } | null;
      if (json?.ok) {
        setDeleteOpen(false);
        setSnapshot(JSON.stringify(form));
        toast.success(`${form.name || "Product"} deleted`);
        onSaved(null, { created: false, deleted: true });
      } else {
        toast.error(json?.error || "Could not delete the product");
      }
    } catch {
      toast.error("Network error. The product was not deleted.");
    } finally {
      setDeleting(false);
    }
  }

  const err = v.errors;
  const publishNeedsImage = form.status === "active" && form.gallery.length === 0;

  return (
    <form ref={formRef} onSubmit={save} noValidate className="w-full">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_22rem]">
        {/* Main column */}
        <div className="min-w-0 space-y-6">
          <AdminFormSection title="Product details">
            <div>
              <AdminFieldLabel htmlFor="product-name" required>
                Name
              </AdminFieldLabel>
              <input
                id="product-name"
                name="name"
                className={adminFieldClass}
                value={form.name}
                maxLength={80}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={err.name ? true : undefined}
                placeholder="Amber Noir"
              />
              <AdminFieldError message={err.name} />
              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.8125rem] text-admin-muted">
                <span className="min-w-0 truncate">
                  Web address:{" "}
                  <span className="text-admin-ink">
                    /products/{form.handle || "your-product"}
                  </span>
                </span>
                {isNew ? (
                  <button
                    type="button"
                    onClick={() => setUrlOpen((o) => !o)}
                    className="cursor-pointer font-semibold text-admin-accent hover:underline"
                    aria-expanded={urlOpen}
                  >
                    {urlOpen ? "Done" : "Edit URL"}
                  </button>
                ) : null}
              </div>
              {isNew && urlOpen ? (
                <div className="mt-3">
                  <AdminFieldLabel htmlFor="product-handle" required>
                    URL name
                  </AdminFieldLabel>
                  <div className="flex items-stretch overflow-hidden rounded-md border border-admin-input-border bg-admin-soft-2 focus-within:border-brass focus-within:ring-2 focus-within:ring-brass/20">
                    <span className="flex items-center border-r border-admin-line bg-admin-soft px-3 text-[0.9375rem] text-admin-muted">
                      /products/
                    </span>
                    <input
                      id="product-handle"
                      name="handle"
                      className="min-h-11 min-w-0 flex-1 bg-transparent px-3 text-base text-admin-ink outline-none"
                      value={form.handle}
                      maxLength={80}
                      aria-invalid={err.handle ? true : undefined}
                      onChange={(e) => {
                        setHandleEdited(true);
                        setField(
                          "handle",
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9-]+/g, "-")
                            .replace(/-{2,}/g, "-"),
                        );
                      }}
                      onBlur={() =>
                        setField("handle", form.handle.replace(/^-+|-+$/g, ""))
                      }
                    />
                  </div>
                  <AdminFieldError message={err.handle} />
                </div>
              ) : !isNew ? null : (
                <AdminFieldError message={err.handle} />
              )}
            </div>

            <div>
              <AdminFieldLabel htmlFor="product-descriptor">
                Short description
              </AdminFieldLabel>
              <input
                id="product-descriptor"
                name="descriptor"
                className={adminFieldClass}
                value={form.descriptor}
                maxLength={160}
                aria-invalid={err.descriptor ? true : undefined}
                onChange={(e) => setField("descriptor", e.target.value)}
                placeholder="Warm amber with a cedar trail"
              />
              <AdminFieldError message={err.descriptor} />
            </div>

            <AdminRichTextEditor
              label="Description"
              value={form.description}
              minHeightClass="min-h-36"
              placeholder="What it smells like and when to wear it."
              onChange={(description) => setField("description", description)}
            />
          </AdminFormSection>

          <AdminFormSection
            title="Images"
            description="The first image is the main photo. The second shows when shoppers hover."
          >
            <div
              data-field="gallery"
              className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-3"
            >
              {form.gallery.map((url, i) => (
                <AdminImageField
                  key={`${i}-${url}`}
                  label={
                    i === 0 ? "Main image" : i === 1 ? "Hover image" : `Image ${i + 1}`
                  }
                  density="compact"
                  aspect="square"
                  value={url}
                  onChange={(next) => setGalleryItem(i, next)}
                  onRemoveSlot={() => removeGalleryItem(i)}
                  actions={
                    i > 0 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => makeMain(i)}
                        className="px-2! no-underline!"
                      >
                        Make main
                      </Button>
                    ) : undefined
                  }
                />
              ))}
              {form.gallery.length < MAX_IMAGES ? (
                <AdminImageField
                  key={`add-${form.gallery.length}`}
                  label={form.gallery.length === 0 ? "Main image" : "Add image"}
                  required={form.gallery.length === 0 && form.status === "active"}
                  density="compact"
                  aspect="square"
                  value=""
                  onChange={(url) => {
                    if (url) setField("gallery", [...form.gallery, url]);
                  }}
                />
              ) : null}
            </div>
            <AdminFieldError message={err.gallery} />
          </AdminFormSection>

          <AdminFormSection title="Sizes and prices">
            <div data-field="prices" className="space-y-3">
              <div className="hidden grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_2.75rem] gap-3 sm:grid">
                <p className="text-sm font-semibold text-admin-ink">
                  Size <span className="text-admin-danger" aria-hidden>*</span>
                </p>
                <p className="text-sm font-semibold text-admin-ink">
                  Price <span className="text-admin-danger" aria-hidden>*</span>
                </p>
                <p className="text-sm font-semibold text-admin-ink">
                  Compare-at price
                </p>
                <span className="sr-only">Remove</span>
              </div>
              {form.prices.map((size, i) => (
                <div
                  key={i}
                  className="grid grid-cols-2 gap-3 rounded-md border border-admin-line p-3 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_2.75rem] sm:items-start sm:border-0 sm:p-0"
                >
                  <div>
                    <p className="mb-1.5 text-sm font-semibold text-admin-ink sm:hidden">
                      Size <span className="text-admin-danger" aria-hidden>*</span>
                    </p>
                    <NumberInput
                      name={`prices.${i}.ml`}
                      label={`Size ${i + 1} in ml`}
                      value={size.ml}
                      suffix="ml"
                      placeholder="50"
                      invalid={Boolean(err[`prices.${i}.ml`])}
                      onChange={(ml) => setSize(i, { ml })}
                    />
                    <AdminFieldError message={err[`prices.${i}.ml`]} />
                  </div>
                  <div>
                    <p className="mb-1.5 text-sm font-semibold text-admin-ink sm:hidden">
                      Price <span className="text-admin-danger" aria-hidden>*</span>
                    </p>
                    <NumberInput
                      name={`prices.${i}.price`}
                      label={`Size ${i + 1} price in rupees`}
                      value={size.price}
                      prefix="Rs"
                      placeholder="15000"
                      invalid={Boolean(err[`prices.${i}.price`])}
                      onChange={(price) => setSize(i, { price })}
                    />
                    <AdminFieldError message={err[`prices.${i}.price`]} />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <p className="mb-1.5 text-sm font-semibold text-admin-ink sm:hidden">
                      Compare-at price
                    </p>
                    <NumberInput
                      name={`prices.${i}.compareAt`}
                      label={`Size ${i + 1} compare-at price`}
                      value={size.compareAt}
                      prefix="Rs"
                      placeholder="Optional"
                      invalid={Boolean(err[`prices.${i}.compareAt`])}
                      onChange={(n) =>
                        setSize(i, { compareAt: Number.isFinite(n) ? n : undefined })
                      }
                    />
                    <AdminFieldError message={err[`prices.${i}.compareAt`]} />
                  </div>
                  <div className="col-span-2 flex justify-end sm:col-span-1">
                    <AdminIconAction
                      icon="delete"
                      tone="danger"
                      label="Remove size"
                      ariaLabel={`Remove size ${i + 1}`}
                      disabled={form.prices.length <= 1}
                      className="h-11! w-11!"
                      onClick={() =>
                        setField(
                          "prices",
                          form.prices.filter((_, j) => j !== i),
                        )
                      }
                    />
                  </div>
                </div>
              ))}
              <AdminFieldError message={err.prices} />
            </div>
            {form.prices.length < MAX_SIZES ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-auto!"
                onClick={() =>
                  setField("prices", [
                    ...form.prices,
                    { ml: Number.NaN, price: Number.NaN, sku: "" },
                  ])
                }
              >
                Add size
              </Button>
            ) : null}
          </AdminFormSection>

          <AdminFormSection title="Scent notes">
            <ChipsField
              label="Top notes"
              name="topNotes"
              values={form.topNotes}
              onChange={(next) => setField("topNotes", next)}
              placeholder="Type a note and press Enter"
              max={MAX_NOTES}
              maxLength={60}
            />
            <ChipsField
              label="Heart notes"
              name="heartNotes"
              values={form.heartNotes}
              onChange={(next) => setField("heartNotes", next)}
              placeholder="Type a note and press Enter"
              max={MAX_NOTES}
              maxLength={60}
            />
            <ChipsField
              label="Base notes"
              name="baseNotes"
              values={form.baseNotes}
              onChange={(next) => setField("baseNotes", next)}
              placeholder="Type a note and press Enter"
              max={MAX_NOTES}
              maxLength={60}
            />
          </AdminFormSection>

          <AdminFormSection title="Product page">
            <AdminRichTextEditor
              label="Story"
              value={form.story}
              minHeightClass="min-h-40"
              placeholder="Opens with… settles into…"
              onChange={(story) => setField("story", story)}
            />
            <AdminRichTextEditor
              label="How to wear"
              value={form.howToWear}
              minHeightClass="min-h-28"
              placeholder="Two sprays on pulse points for evening."
              onChange={(howToWear) => setField("howToWear", howToWear)}
            />
          </AdminFormSection>
        </div>

        {/* Sidebar */}
        <aside className="min-w-0 space-y-6">
          <AdminFormSection title="Status">
            <Select
              label="Visibility"
              value={form.status}
              onValueChange={(next) => setField("status", next)}
              options={[
                { value: "active", label: "Published" },
                { value: "draft", label: "Draft (hidden)" },
                { value: "archived", label: "Archived (hidden)" },
              ]}
              className={selectLabel}
            />
            {publishNeedsImage ? (
              <p className="-mt-2 text-[0.8125rem] font-medium text-(--admin-tone-amber-text)">
                Add a main image before publishing.
              </p>
            ) : null}
            <CheckRow
              checked={form.inStock}
              onChange={(next) => setField("inStock", next)}
              label="In stock"
            />
          </AdminFormSection>

          <AdminFormSection title="Organization">
            <Select
              label="Concentration"
              value={form.concentration}
              onValueChange={(next) => setField("concentration", next)}
              options={[
                { value: "EDP", label: "Eau de parfum (EDP)" },
                { value: "EDT", label: "Eau de toilette (EDT)" },
                { value: "PARFUM", label: "Parfum" },
              ]}
              className={selectLabel}
            />
            <Select
              label="Scent family"
              value={form.family}
              onValueChange={(next) => setField("family", next)}
              options={familyOptions(form.family)}
              className={selectLabel}
            />
            <Select
              label="For"
              value={form.gender}
              onValueChange={(next) => setField("gender", next)}
              options={[
                { value: "her", label: "Her" },
                { value: "him", label: "Him" },
                { value: "unisex", label: "Everyone (unisex)" },
              ]}
              className={selectLabel}
            />
            <div>
              <p className="mb-2 text-sm font-semibold text-admin-ink">
                Collections
              </p>
              {collections.length === 0 ? (
                <p className="text-[0.9375rem] text-admin-muted">
                  No collections yet.
                </p>
              ) : (
                <ul className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
                  {collections.map((c) => {
                    const checked = form.collectionHandles.includes(c.handle);
                    return (
                      <li key={c.handle}>
                        <label
                          className={cn(
                            "flex min-h-11 cursor-pointer items-center gap-3 rounded-md border px-3 text-[0.9375rem] transition-colors",
                            checked
                              ? "border-admin-ink bg-admin-soft"
                              : "border-admin-line bg-admin-soft-2 hover:border-admin-muted",
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleCollection(c.handle)}
                            className="h-4.5 w-4.5 shrink-0 cursor-pointer accent-brass"
                          />
                          <span className="min-w-0 flex-1 truncate font-medium text-admin-ink">
                            {c.title}
                          </span>
                          {c.status === "draft" ? (
                            <span className="text-[0.8125rem] text-admin-muted">
                              Hidden
                            </span>
                          ) : null}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </AdminFormSection>

          <AdminFormSection title="Performance">
            <ScaleField
              label="Sillage"
              value={form.sillage}
              onChange={(n) => setField("sillage", n)}
              low="Close to skin"
              high="Fills a room"
            />
            <ScaleField
              label="Longevity"
              value={form.longevity}
              onChange={(n) => setField("longevity", n)}
              low="A few hours"
              high="All day"
            />
          </AdminFormSection>

          <AdminFormSection title="Ingredients">
            <ChipsField
              label="Ingredients"
              name="ingredients"
              values={form.ingredients}
              onChange={(next) => setField("ingredients", next)}
              placeholder="Type one and press Enter"
              max={MAX_INGREDIENTS}
              maxLength={80}
            />
            <CheckRow
              checked={form.containsAlcohol}
              onChange={(next) =>
                setForm((f) => ({
                  ...f,
                  containsAlcohol: next,
                  ingredients: next
                    ? f.ingredients
                    : withoutAlcoholIngredients(f.ingredients),
                }))
              }
              label="Contains alcohol"
            />
            <div>
              <AdminFieldLabel htmlFor="product-country">
                Country of origin
              </AdminFieldLabel>
              <input
                id="product-country"
                name="countryOfOrigin"
                className={adminFieldClass}
                value={form.countryOfOrigin}
                maxLength={60}
                aria-invalid={err.countryOfOrigin ? true : undefined}
                onChange={(e) => setField("countryOfOrigin", e.target.value)}
                placeholder="Pakistan"
              />
              <AdminFieldError message={err.countryOfOrigin} />
            </div>
          </AdminFormSection>
        </aside>
      </div>

      {serverError ? (
        <div className="mt-6">
          <AdminFormError>{serverError}</AdminFormError>
        </div>
      ) : null}

      {/* Save bar */}
      <div className="sticky bottom-0 z-20 -mx-4 mt-6 border-t border-admin-line bg-admin-paper/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 2xl:-mx-10 2xl:px-10">
        <div className="flex items-center justify-between gap-3">
          <p
            className={cn(
              "items-center gap-2 text-[0.9375rem] text-admin-muted",
              dirty ? "hidden min-[480px]:flex" : "hidden sm:flex",
            )}
            aria-live="polite"
          >
            {dirty ? (
              <>
                <span className="h-2 w-2 rounded-full bg-brass" aria-hidden />
                Unsaved changes
              </>
            ) : isNew ? (
              "New product"
            ) : (
              "All changes saved"
            )}
          </p>
          <div className="flex flex-1 gap-2 sm:flex-none sm:justify-end">
            {!isNew && canDelete ? (
              <Button
                type="button"
                variant="danger-outline"
                className="w-auto! shrink-0"
                disabled={saving || deleting}
                onClick={() => setDeleteOpen(true)}
              >
                Delete
              </Button>
            ) : null}
            <Button
              type="submit"
              className="flex-1 sm:w-auto! sm:min-w-36 sm:flex-none"
              disabled={saving || deleting || (!isNew && !dirty)}
            >
              {saving ? "Saving…" : isNew ? "Create product" : "Save changes"}
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this product?"
        description={`${form.name || "This product"} will be removed from your store. This cannot be undone.`}
        confirmLabel="Delete product"
        cancelLabel="Keep product"
        loading={deleting}
        onConfirm={remove}
      />
      {leaveGuard}
    </form>
  );
}
