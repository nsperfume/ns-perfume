"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BrandLoaderBlock } from "@/components/brand/brand-loader";
import { useRouter } from "next/navigation";
import slugify from "slugify";
import { z } from "zod";
import { ChevronsLeftIcon } from "@animateicons/react/lucide";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminImageField } from "@/components/admin/image-field";
import { AdminRichTextEditor } from "@/components/admin/rich-text-editor";
import {
  AdminFieldLabel,
  AdminFormSection,
  adminFieldClass,
} from "@/components/admin/form-section";
import {
  AdminSearchableSelect,
  type SearchableOption,
} from "@/components/admin/searchable-select";
import {
  AdminActionDivider,
  AdminEmptyState,
  AdminFilterChips,
  AdminIconAction,
  AdminNotice,
  AdminPageHeader,
  AdminRowActions,
  AdminSearchInput,
  AdminStatusBadge,
  AdminTable,
  AdminTd,
  AdminTh,
  readAdminJson,
} from "@/components/admin/ui";
import { Button } from "@/components/admin/button";
import { Select } from "@/components/admin/select";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { toast } from "@/components/admin/toast";
import {
  AdminFieldError,
  AdminFormError,
  useFormValidation,
} from "@/components/admin/form-validation";
import { useUnsavedChangesGuard } from "@/components/admin/unsaved-changes";
import { richTextToPlain, sanitizeRichHtml, toRichHtml } from "@/lib/rich-text";

type Collection = {
  _id: string;
  handle: string;
  title: string;
  description?: string;
  status?: string;
  bannerImage?: string;
  productHandles?: string[];
  filterTags?: string[];
};

type CatalogProduct = {
  handle: string;
  name: string;
  status?: string;
  imagePrimary?: string;
  tags?: string[];
  badges?: string[];
  collectionHandles?: string[];
};

type FormState = {
  title: string;
  handle: string;
  description: string;
  bannerImage: string;
  status: "active" | "draft";
  productHandles: string[];
};

const EMPTY_FORM: FormState = {
  title: "",
  handle: "",
  description: "",
  bannerImage: "",
  status: "draft",
  productHandles: [],
};

const HANDLE_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Mirrors PUT /api/collections/[handle]: title required (2+). The URL is fixed after create. */
const editSchema = z.object({
  title: z.string().trim().min(2, "Enter a collection name (at least 2 characters)"),
  descriptionText: z.string().max(500, "Keep the description under 500 characters"),
});

/** Mirrors POST /api/collections: also needs a web address (handle) of 2+ characters. */
const createSchema = editSchema.extend({
  handle: z
    .string()
    .trim()
    .min(2, "Add a web address of at least 2 letters or numbers")
    .regex(HANDLE_RE, "Use lowercase letters, numbers and single hyphens"),
});

function toHandle(text: string) {
  return slugify(text, { lower: true, strict: true, trim: true });
}

/** Same membership rules as the storefront (src/lib/collection-query.ts). */
function liveProductCount(c: Collection, products: CatalogProduct[]) {
  const picked = new Set(c.productHandles || []);
  const tags = (c.filterTags || []).filter(Boolean);
  const badges = tags
    .filter((t) => t.startsWith("badge:"))
    .map((t) => t.replace("badge:", ""));
  return products.filter(
    (p) =>
      (p.status ?? "active") === "active" &&
      (picked.has(p.handle) ||
        (p.collectionHandles || []).includes(c.handle) ||
        (p.tags || []).some((t) => tags.includes(t)) ||
        (p.badges || []).some((b) => badges.includes(b))),
  ).length;
}

export default function AdminCollectionsPage() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [user, setUser] = useState<{
    email?: string;
    name?: string;
    role?: string;
    isSuperAdmin?: boolean;
  } | null>(null);
  const [items, setItems] = useState<Collection[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  // Editor
  const [mode, setMode] = useState<"list" | "edit">("list");
  const [editing, setEditing] = useState<Collection | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [baseline, setBaseline] = useState<FormState>(EMPTY_FORM);
  const [handleTouched, setHandleTouched] = useState(false);
  const [urlOpen, setUrlOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [discardOpen, setDiscardOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [rowDelete, setRowDelete] = useState<Collection | null>(null);
  const schema = editing ? editSchema : createSchema;
  const v = useFormValidation(schema);

  const canDelete = Boolean(
    user?.isSuperAdmin || user?.role === "super_admin",
  );

  const dirty =
    mode === "edit" && JSON.stringify(form) !== JSON.stringify(baseline);
  const leaveGuard = useUnsavedChangesGuard(dirty && !saving);

  const productOptions: SearchableOption[] = useMemo(
    () =>
      products.map((p) => ({
        value: p.handle,
        label: p.name,
        hint: p.status && p.status !== "active" ? "Draft" : undefined,
      })),
    [products],
  );
  const productByHandle = useMemo(
    () => new Map(products.map((p) => [p.handle, p])),
    [products],
  );

  function load() {
    setLoading(true);
    fetch("/api/collections?all=1")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) {
          setItems(j.data);
          setLoadError("");
        } else setLoadError(j.error || "Could not load collections");
      })
      .catch(() => setLoadError("Network error while loading collections"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetch("/api/admin/auth")
      .then((r) => r.json())
      .then((j) => {
        if (!j.ok) router.replace("/admin/login");
        else setUser(j.data);
      });
    load();
    fetch("/api/products?all=1")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok && Array.isArray(j.data)) setProducts(j.data);
      })
      .catch(() => {
        /* picker stays empty */
      });
  }, [router]);

  const counts = useMemo(
    () => ({
      all: items.length,
      active: items.filter((c) => (c.status || "active") === "active").length,
      draft: items.filter((c) => c.status === "draft").length,
    }),
    [items],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((c) => {
      const s = c.status || "active";
      if (filter !== "all" && s !== filter) return false;
      if (!q) return true;
      return c.title.toLowerCase().includes(q);
    });
  }, [items, query, filter]);

  function scrollTop() {
    document
      .getElementById("admin-main-scroll")
      ?.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openEditor(c: Collection | null) {
    const next: FormState = c
      ? {
          title: c.title,
          handle: c.handle,
          description: toRichHtml(c.description || ""),
          bannerImage: c.bannerImage || "",
          status: c.status === "draft" ? "draft" : "active",
          productHandles: c.productHandles || [],
        }
      : EMPTY_FORM;
    setEditing(c);
    setForm(next);
    setBaseline(next);
    setHandleTouched(Boolean(c));
    setUrlOpen(false);
    setFormError("");
    v.reset();
    setMode("edit");
    scrollTop();
  }

  function closeEditor() {
    setMode("list");
    setEditing(null);
    setDiscardOpen(false);
    scrollTop();
  }

  function requestClose() {
    if (dirty) setDiscardOpen(true);
    else closeEditor();
  }

  function validationValues(f: FormState = form) {
    return {
      title: f.title,
      // The address follows the name until edited; only flag it once there is a name.
      handle: !handleTouched && !f.title.trim() ? "pending" : f.handle,
      descriptionText: richTextToPlain(f.description),
    };
  }

  function update(patch: Partial<FormState>) {
    const next = { ...form, ...patch };
    if (patch.title !== undefined && !editing && !handleTouched) {
      next.handle = toHandle(patch.title);
    }
    setForm(next);
    v.revalidate(validationValues(next));
  }

  function addProduct(value: string) {
    const h = value.trim();
    if (!h || !productByHandle.has(h)) return;
    if (form.productHandles.includes(h)) return;
    update({ productHandles: [...form.productHandles, h] });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    const values = validationValues();
    if (!v.validate(values, formRef.current)) {
      const parsed = schema.safeParse(values);
      if (
        !parsed.success &&
        parsed.error.issues.some((i) => i.path[0] === "handle")
      ) {
        setUrlOpen(true);
      }
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      description: sanitizeRichHtml(toRichHtml(form.description)),
      bannerImage: form.bannerImage.trim(),
      status: form.status,
      productHandles: form.productHandles,
    };
    try {
      const res = editing
        ? await fetch(`/api/collections/${encodeURIComponent(editing.handle)}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/collections", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...payload, handle: form.handle.trim() }),
          });
      const json = await readAdminJson<Collection>(res);
      if (!json.ok) {
        const message =
          json.error ||
          (editing ? "Could not save collection" : "Could not create collection");
        setFormError(message);
        if (/handle/i.test(message)) {
          setUrlOpen(true);
          v.setErrors({ handle: "This web address is already used by another collection" });
        }
        toast.error(message);
        return;
      }
      toast.success(editing ? "Collection saved" : "Collection created");
      if (json.data) {
        const saved = json.data;
        const next: FormState = {
          title: saved.title,
          handle: saved.handle,
          description: toRichHtml(saved.description || ""),
          bannerImage: saved.bannerImage || "",
          status: saved.status === "draft" ? "draft" : "active",
          productHandles: saved.productHandles || [],
        };
        setEditing(saved);
        setForm(next);
        setBaseline(next);
        setHandleTouched(true);
        setUrlOpen(false);
      } else {
        setBaseline(form);
      }
      load();
    } catch {
      setFormError("Network error. Nothing was saved, try again.");
      toast.error("Network error. Nothing was saved.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteFromList() {
    if (!rowDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/collections/${encodeURIComponent(rowDelete.handle)}`,
        { method: "DELETE" },
      );
      const json = await readAdminJson(res);
      if (!json.ok) {
        toast.error(json.error || "Could not delete collection");
        return;
      }
      toast.success(`Deleted ${rowDelete.title}`);
      setRowDelete(null);
      load();
    } catch {
      toast.error("Network error. The collection was not deleted.");
    } finally {
      setDeleting(false);
    }
  }

  async function confirmDelete() {
    if (!editing) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/collections/${encodeURIComponent(editing.handle)}`,
        { method: "DELETE" },
      );
      const json = await readAdminJson(res);
      if (!json.ok) {
        toast.error(json.error || "Could not delete collection");
        return;
      }
      toast.success(`Deleted ${editing.title}`);
      setDeleteOpen(false);
      setBaseline(form);
      closeEditor();
      load();
    } catch {
      toast.error("Network error. The collection was not deleted.");
    } finally {
      setDeleting(false);
    }
  }

  const shell = (children: React.ReactNode) => (
    <AdminShell user={user}>
      {children}
      {leaveGuard}
    </AdminShell>
  );

  /* ---------------------------- Editor view ---------------------------- */
  if (mode === "edit") {
    const handle = editing ? editing.handle : form.handle;
    const saveLabel = saving
      ? "Saving…"
      : editing
        ? "Save"
        : "Create collection";
    return shell(
      <>
        <button
          type="button"
          onClick={requestClose}
          className="-ml-1.5 mb-3 inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-md px-1.5 text-sm font-semibold text-admin-muted transition-colors hover:bg-admin-soft hover:text-admin-ink"
        >
          <ChevronsLeftIcon size={16} color="currentColor" isAnimated={false} />
          Collections
        </button>
        <AdminPageHeader
          title={editing ? editing.title : "New collection"}
          action={
            <Button
              type="submit"
              form="collection-form"
              disabled={saving || (Boolean(editing) && !dirty)}
              className="max-sm:hidden!"
            >
              {saveLabel}
            </Button>
          }
        />

        <form
          id="collection-form"
          ref={formRef}
          onSubmit={submit}
          noValidate
          className="grid gap-6 pb-24 sm:pb-0 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start 2xl:grid-cols-[minmax(0,1fr)_24rem]"
        >
          <div className="min-w-0 space-y-6">
            {formError ? <AdminFormError>{formError}</AdminFormError> : null}

            <AdminFormSection title="Details">
              <div>
                <AdminFieldLabel htmlFor="collection-title" required>
                  Name
                </AdminFieldLabel>
                <input
                  id="collection-title"
                  name="title"
                  className={adminFieldClass}
                  value={form.title}
                  aria-invalid={v.errors.title ? true : undefined}
                  onChange={(e) => update({ title: e.target.value })}
                  onBlur={() => v.revalidate(validationValues())}
                  placeholder="For him"
                  maxLength={120}
                />
                <AdminFieldError message={v.errors.title} />
              </div>
              <div data-field="descriptionText">
                <AdminRichTextEditor
                  label="Description"
                  value={form.description}
                  error={v.errors.descriptionText}
                  minHeightClass="min-h-32"
                  placeholder="Cedar, vetiver and leather for daytime and desk."
                  onChange={(description) => update({ description })}
                />
              </div>
            </AdminFormSection>

            <AdminFormSection
              title="Products"
              description="Bottles also join when this collection is ticked on the product page."
            >
              <AdminSearchableSelect
                label="Add a product"
                value=""
                options={productOptions.filter(
                  (o) => !form.productHandles.includes(o.value),
                )}
                placeholder="Search products"
                emptyLabel="No matching products."
                onChange={addProduct}
              />
              {form.productHandles.length ? (
                <ul className="divide-y divide-admin-line overflow-hidden rounded-md border border-admin-line">
                  {form.productHandles.map((h) => {
                    const p = productByHandle.get(h);
                    return (
                      <li
                        key={h}
                        className="flex min-h-14 items-center gap-3 bg-admin-paper px-3 py-2"
                      >
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-admin-line bg-admin-soft">
                          {p?.imagePrimary ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.imagePrimary}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[0.9375rem] font-medium text-admin-ink">
                            {p?.name || h}
                          </p>
                          {!p && products.length ? (
                            <p className="text-[0.8125rem] text-admin-muted">
                              No longer in the catalog
                            </p>
                          ) : p?.status && p.status !== "active" ? (
                            <p className="text-[0.8125rem] text-admin-muted">
                              Draft, not visible in the shop
                            </p>
                          ) : null}
                        </div>
                        <AdminIconAction
                          icon="delete"
                          tone="danger"
                          label="Remove from collection"
                          ariaLabel={`Remove ${p?.name || h} from this collection`}
                          onClick={() =>
                            update({
                              productHandles: form.productHandles.filter(
                                (x) => x !== h,
                              ),
                            })
                          }
                        />
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-[0.9375rem] text-admin-muted">
                  No products added yet.
                </p>
              )}
            </AdminFormSection>
          </div>

          <aside className="min-w-0 space-y-6 lg:sticky lg:top-4">
            <AdminFormSection title="Visibility">
              <Select
                label="Status"
                value={form.status}
                onValueChange={(s) => update({ status: s as "active" | "draft" })}
                options={[
                  { value: "active", label: "Published" },
                  { value: "draft", label: "Draft (hidden from shop)" },
                ]}
              />
              <div>
                <p className="text-sm font-semibold text-admin-ink">Web address</p>
                <p className="mt-1 break-all text-[0.9375rem] text-admin-muted">
                  /collections/{handle || "…"}
                </p>
                {!editing ? (
                  urlOpen ? (
                    <div className="mt-3">
                      <AdminFieldLabel htmlFor="collection-handle">
                        Edit web address
                      </AdminFieldLabel>
                      <input
                        id="collection-handle"
                        name="handle"
                        className={adminFieldClass}
                        value={form.handle}
                        aria-invalid={v.errors.handle ? true : undefined}
                        onChange={(e) => {
                          setHandleTouched(true);
                          update({
                            handle: e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9-]/g, ""),
                          });
                        }}
                        onBlur={() => v.revalidate(validationValues())}
                        placeholder="for-him"
                        maxLength={80}
                      />
                      <AdminFieldError message={v.errors.handle} />
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setUrlOpen(true)}
                        className="mt-1 cursor-pointer text-sm font-semibold text-admin-accent hover:underline"
                      >
                        Edit web address
                      </button>
                      <AdminFieldError message={v.errors.handle} />
                    </>
                  )
                ) : form.status === "active" ? (
                  <a
                    href={`/collections/${handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-sm font-semibold text-admin-accent hover:underline"
                  >
                    View in shop
                  </a>
                ) : null}
              </div>
            </AdminFormSection>

            <AdminFormSection title="Banner image">
              <AdminImageField
                label="Image"
                value={form.bannerImage}
                onChange={(bannerImage) => update({ bannerImage })}
                aspect="wide"
              />
            </AdminFormSection>

            {editing && canDelete ? (
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="danger-outline"
                  size="sm"
                  className="w-auto!"
                  onClick={() => setDeleteOpen(true)}
                >
                  Delete collection
                </Button>
              </div>
            ) : null}
          </aside>

          {/* Phones: save stays within thumb reach */}
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-admin-line bg-admin-paper/95 px-4 py-3 backdrop-blur sm:hidden">
            <Button
              type="submit"
              disabled={saving || (Boolean(editing) && !dirty)}
              className="w-full"
            >
              {saveLabel}
            </Button>
          </div>
        </form>

        <ConfirmDialog
          open={discardOpen}
          onOpenChange={setDiscardOpen}
          title="Discard unsaved changes?"
          description="Your edits to this collection will be lost."
          confirmLabel="Discard changes"
          cancelLabel="Keep editing"
          onConfirm={closeEditor}
        />
        <ConfirmDialog
          open={deleteOpen}
          onOpenChange={(o) => {
            if (!o && !deleting) setDeleteOpen(false);
          }}
          title="Delete this collection?"
          description={
            editing
              ? `${editing.title} will be removed from the shop. The products stay in your catalog.`
              : "This collection will be removed."
          }
          confirmLabel="Delete collection"
          cancelLabel="Keep collection"
          loading={deleting}
          onConfirm={confirmDelete}
        />
      </>,
    );
  }

  /* ----------------------------- List view ----------------------------- */
  const listEmpty = loading ? (
    <BrandLoaderBlock className="min-h-[40vh]" label="Loading collections" />
  ) : items.length ? (
    <AdminEmptyState
      title="No collections match"
      action={
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="w-auto!"
          onClick={() => {
            setQuery("");
            setFilter("all");
          }}
        >
          Clear filters
        </Button>
      }
    />
  ) : (
    <AdminEmptyState
      title="No collections yet"
      description="Group bottles so shoppers can browse by mood or occasion."
      action={
        <Button type="button" onClick={() => openEditor(null)}>
          Add collection
        </Button>
      }
    />
  );

  return shell(
    <>
      <AdminPageHeader
        title="Collections"
        action={
          <Button type="button" onClick={() => openEditor(null)}>
            Add collection
          </Button>
        }
      />

      {loadError ? (
        <AdminNotice tone="error" onDismiss={() => setLoadError("")}>
          {loadError}
        </AdminNotice>
      ) : null}

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <AdminFilterChips
          label="Filter collections"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All", count: counts.all },
            { value: "active", label: "Published", count: counts.active },
            { value: "draft", label: "Draft", count: counts.draft },
          ]}
        />
        <AdminSearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search collections"
          className="w-full md:w-72"
        />
      </div>

      {/* Phones: one card per collection so the actions never run off screen */}
      <div className="md:hidden">
        {visible.length ? (
          <ul className="space-y-3" aria-label="Collections">
            {visible.map((c) => {
              const live = (c.status || "active") === "active";
              const count = products.length ? liveProductCount(c, products) : null;
              return (
                <li
                  key={c.handle}
                  className="rounded-lg border border-admin-line bg-admin-paper p-4 shadow-admin"
                >
                  <button
                    type="button"
                    onClick={() => openEditor(c)}
                    className="flex w-full min-w-0 cursor-pointer items-start gap-3 text-left"
                  >
                    <span className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-admin-line bg-admin-soft">
                      {c.bannerImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.bannerImage}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-admin-ink">
                        {c.title}
                      </span>
                      {count !== null ? (
                        <span className="mt-0.5 block text-[0.8125rem] text-admin-muted">
                          <span className="font-sans tabular-nums">{count}</span>{" "}
                          {count === 1 ? "product" : "products"}
                        </span>
                      ) : null}
                    </span>
                    <AdminStatusBadge status={c.status || "active"} className="shrink-0" />
                  </button>
                  {c.description ? (
                    <p className="mt-2 line-clamp-2 text-[0.8125rem] text-admin-muted">
                      {richTextToPlain(c.description)}
                    </p>
                  ) : null}
                  <div className="mt-3 border-t border-admin-line pt-2">
                    <AdminRowActions>
                      {live ? (
                        <AdminIconAction
                          icon="view"
                          label="View in store"
                          ariaLabel={`View ${c.title} in the store`}
                          href={`/collections/${encodeURIComponent(c.handle)}`}
                          external
                        />
                      ) : null}
                      <AdminIconAction
                        icon="edit"
                        label="Edit collection"
                        ariaLabel={`Edit ${c.title}`}
                        onClick={() => openEditor(c)}
                      />
                      {canDelete ? (
                        <>
                          <AdminActionDivider />
                          <AdminIconAction
                            icon="delete"
                            tone="danger"
                            label="Delete collection"
                            ariaLabel={`Delete ${c.title}`}
                            onClick={() => setRowDelete(c)}
                          />
                        </>
                      ) : null}
                    </AdminRowActions>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="rounded-lg border border-admin-line bg-admin-paper">
            {listEmpty}
          </div>
        )}
      </div>

      <AdminTable compact className="hidden md:block">
        <thead>
          <tr>
            <AdminTh>Collection</AdminTh>
            <AdminTh numeric className="hidden sm:table-cell">
              Products
            </AdminTh>
            <AdminTh className="w-32">Status</AdminTh>
            <AdminTh className="w-12 text-right sm:w-40">Actions</AdminTh>
          </tr>
        </thead>
        <tbody>
          {visible.map((c) => (
            <tr
              key={c.handle}
              tabIndex={0}
              onClick={(e) => {
                if ((e.target as HTMLElement).closest("[data-row-ignore]")) return;
                openEditor(c);
              }}
              onKeyDown={(e) => {
                if (e.target !== e.currentTarget) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openEditor(c);
                }
              }}
              className="cursor-pointer outline-none transition-colors hover:bg-admin-soft-2 focus-visible:bg-admin-soft-2"
              aria-label={`Edit ${c.title}`}
            >
              <AdminTd>
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 shrink-0 overflow-hidden rounded-md border border-admin-line bg-admin-soft">
                    {c.bannerImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.bannerImage}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-admin-ink">{c.title}</p>
                    {c.description ? (
                      <p className="line-clamp-1 text-[0.8125rem] text-admin-muted">
                        {richTextToPlain(c.description)}
                      </p>
                    ) : null}
                  </div>
                </div>
              </AdminTd>
              <AdminTd numeric className="hidden sm:table-cell">
                {products.length ? liveProductCount(c, products) : ""}
              </AdminTd>
              <AdminTd>
                <AdminStatusBadge status={c.status || "active"} />
              </AdminTd>
              <AdminTd className="py-2">
                <AdminRowActions>
                  {(c.status || "active") === "active" ? (
                    <AdminIconAction
                      icon="view"
                      label="View in store"
                      ariaLabel={`View ${c.title} in the store`}
                      href={`/collections/${encodeURIComponent(c.handle)}`}
                      external
                      className="max-sm:hidden"
                    />
                  ) : null}
                  <AdminIconAction
                    icon="edit"
                    label="Edit collection"
                    ariaLabel={`Edit ${c.title}`}
                    onClick={() => openEditor(c)}
                  />
                  {canDelete ? (
                    <span className="hidden items-center sm:flex">
                      <AdminActionDivider />
                      <AdminIconAction
                        icon="delete"
                        tone="danger"
                        label="Delete collection"
                        ariaLabel={`Delete ${c.title}`}
                        onClick={() => setRowDelete(c)}
                      />
                    </span>
                  ) : null}
                </AdminRowActions>
              </AdminTd>
            </tr>
          ))}
          {!visible.length ? (
            <tr>
              <td colSpan={4}>{listEmpty}</td>
            </tr>
          ) : null}
        </tbody>
      </AdminTable>

      <ConfirmDialog
        open={rowDelete !== null}
        onOpenChange={(o) => {
          if (!o && !deleting) setRowDelete(null);
        }}
        title="Delete this collection?"
        description={
          rowDelete
            ? `${rowDelete.title} will be removed from the shop. The products stay in your catalog.`
            : "This collection will be removed."
        }
        confirmLabel="Delete collection"
        cancelLabel="Keep collection"
        loading={deleting}
        onConfirm={deleteFromList}
      />
    </>,
  );
}
