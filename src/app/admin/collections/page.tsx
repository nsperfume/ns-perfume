"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
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
  AdminNotice,
  AdminPageHeader,
  AdminStatusBadge,
  AdminTable,
  AdminTd,
  AdminTh,
  readAdminJson,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";
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

const formSchema = z.object({
  title: z.string().trim().min(2, "Title needs at least 2 characters"),
  handle: z
    .string()
    .trim()
    .min(2, "Handle needs at least 2 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers, hyphens",
    ),
  description: z.string().optional(),
  bannerImage: z
    .string()
    .trim()
    .refine(
      (v) =>
        !v ||
        v.startsWith("/") ||
        v.startsWith("http://") ||
        v.startsWith("https://"),
      "Use a full URL or a site path starting with /",
    )
    .optional(),
  status: z.enum(["active", "draft"]),
});

export default function AdminCollectionsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{
    email?: string;
    name?: string;
    role?: string;
    isSuperAdmin?: boolean;
  } | null>(null);
  const [items, setItems] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [productOptions, setProductOptions] = useState<SearchableOption[]>([]);
  const [editing, setEditing] = useState<Collection | null>(null);
  const [title, setTitle] = useState("");
  const [handle, setHandle] = useState("");
  const [description, setDescription] = useState("");
  const [bannerImage, setBannerImage] = useState("");
  const [status, setStatus] = useState<"active" | "draft">("draft");
  const [productHandles, setProductHandles] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [notice, setNotice] = useState<{
    text: string;
    tone: "info" | "error";
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Collection | null>(null);
  const [deleting, setDeleting] = useState(false);

  const canDelete = Boolean(
    user?.isSuperAdmin || user?.role === "super_admin",
  );

  const productLabel = useMemo(() => {
    const map = new Map(productOptions.map((o) => [o.value, o.label]));
    return (h: string) => map.get(h);
  }, [productOptions]);

  function load() {
    setLoading(true);
    fetch("/api/collections?all=1")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setItems(j.data);
        else
          setNotice({
            text: j.error || "Could not load collections",
            tone: "error",
          });
      })
      .catch(() =>
        setNotice({
          text: "Network error while loading collections",
          tone: "error",
        }),
      )
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
        if (!j.ok || !Array.isArray(j.data)) return;
        setProductOptions(
          (j.data as { handle: string; name: string; status?: string }[]).map(
            (p) => ({
              value: p.handle,
              label: p.name,
              hint: p.status && p.status !== "active" ? p.status : undefined,
            }),
          ),
        );
      })
      .catch(() => {
        /* picker falls back to typed handles */
      });
  }, [router]);

  function resetForm() {
    setEditing(null);
    setTitle("");
    setHandle("");
    setDescription("");
    setBannerImage("");
    setStatus("draft");
    setProductHandles([]);
    setErrors({});
    setFormError("");
  }

  function startEdit(c: Collection) {
    setEditing(c);
    setTitle(c.title);
    setHandle(c.handle);
    setDescription(toRichHtml(c.description || ""));
    setBannerImage(c.bannerImage || "");
    setStatus(c.status === "draft" ? "draft" : "active");
    setProductHandles(c.productHandles || []);
    setErrors({});
    setFormError("");
    setNotice(null);
    setShowForm(true);
    document
      .getElementById("admin-main-scroll")
      ?.scrollTo({ top: 0, behavior: "smooth" });
  }

  function addProductHandle(value: string) {
    const h = value.trim();
    // Only real catalog handles; ignore stray typed text.
    if (!h || !productOptions.some((o) => o.value === h)) return;
    setProductHandles((list) => (list.includes(h) ? list : [...list, h]));
  }

  function removeProductHandle(h: string) {
    setProductHandles((list) => list.filter((x) => x !== h));
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/collections/${encodeURIComponent(deleteTarget.handle)}`,
        { method: "DELETE" },
      );
      const json = await readAdminJson(res);
      if (!json.ok) {
        setNotice({
          text: json.error || "Could not delete collection",
          tone: "error",
        });
        return;
      }
      if (editing?.handle === deleteTarget.handle) resetForm();
      setNotice({ text: `Deleted ${deleteTarget.title}`, tone: "info" });
      setDeleteTarget(null);
      load();
    } catch {
      setNotice({
        text: "Network error. The collection was not deleted.",
        tone: "error",
      });
    } finally {
      setDeleting(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setErrors({});
    const plainDescription = richTextToPlain(description);
    if (plainDescription.length > 500) {
      setErrors({ description: "Keep under 500 characters" });
      return;
    }
    // The handle is locked while editing, so only validate it on create.
    const schema = editing
      ? formSchema.extend({ handle: z.string() })
      : formSchema;
    const parsed = schema.safeParse({
      title,
      handle: editing ? editing.handle : handle,
      description: sanitizeRichHtml(toRichHtml(description)),
      bannerImage,
      status,
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] || "form");
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setSaving(true);
    try {
      const { handle: parsedHandle, ...fields } = parsed.data;
      const res = editing
        ? await fetch(`/api/collections/${encodeURIComponent(editing.handle)}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...fields,
              bannerImage: fields.bannerImage || "",
              productHandles,
            }),
          })
        : await fetch("/api/collections", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...fields,
              handle: parsedHandle,
              productHandles,
            }),
          });
      const json = await readAdminJson(res);
      if (!json.ok) {
        setFormError(
          json.error ||
            (editing ? "Could not save collection" : "Could not create collection"),
        );
        return;
      }
      setNotice({
        text: editing ? `Saved ${parsed.data.title}` : `Created ${parsed.data.title}`,
        tone: "info",
      });
      resetForm();
      load();
    } catch {
      setFormError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell user={user}>
      <AdminPageHeader
        title="Collections"
        description="Group bottles for shop navigation. Draft stays off the storefront."
        action={
          editing ? (
            <Button
              type="button"
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
            >
              New collection
            </Button>
          ) : (
            <Button
              type="button"
              variant={showForm ? "secondary" : "primary"}
              onClick={() => setShowForm((v) => !v)}
            >
              {showForm ? "Hide form" : "New collection"}
            </Button>
          )
        }
      />

      {notice ? (
        <AdminNotice tone={notice.tone} onDismiss={() => setNotice(null)}>
          {notice.text}
        </AdminNotice>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:items-start">
        {/* List — left */}
        <div className="min-w-0">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-display text-base font-medium text-admin-ink">
              All collections
              <span className="ml-2 text-sm font-normal text-admin-muted">
                {items.length}
              </span>
            </h2>
            <Tooltip content="A bottle shows in a collection when it is picked here, ticked under Categories on the product, or matches the collection's filter tags. With none of these the collection is empty.">
              <button
                type="button"
                className="cursor-help font-display text-xs text-admin-muted underline-offset-2 hover:underline"
              >
                How linking works
              </button>
            </Tooltip>
          </div>
          <AdminTable>
            <thead>
              <tr>
                <AdminTh>Collection</AdminTh>
                <AdminTh>Handle</AdminTh>
                <AdminTh>Status</AdminTh>
                <AdminTh className="text-right">Actions</AdminTh>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr
                  key={c.handle}
                  className={cn(
                    "hover:bg-admin-soft",
                    editing?.handle === c.handle && "bg-admin-soft",
                  )}
                >
                  <AdminTd>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-admin-line bg-admin-soft">
                        {c.bannerImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={c.bannerImage}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div>
                        <p className="font-semibold text-admin-ink">
                          {c.title}
                        </p>
                        {c.description ? (
                          <p className="line-clamp-1 text-xs text-admin-muted">
                            {richTextToPlain(c.description)}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </AdminTd>
                  <AdminTd>
                    <span className="font-mono text-xs text-admin-muted">
                      {c.handle}
                    </span>
                  </AdminTd>
                  <AdminTd>
                    <AdminStatusBadge status={c.status || "active"} />
                  </AdminTd>
                  <AdminTd className="text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-10! min-h-10! w-auto! px-4!"
                        onClick={() => startEdit(c)}
                      >
                        Edit
                      </Button>
                      {canDelete ? (
                        <Button
                          type="button"
                          variant="danger"
                          className="h-10! min-h-10! w-auto! px-4!"
                          onClick={() => setDeleteTarget(c)}
                        >
                          Delete
                        </Button>
                      ) : null}
                    </div>
                  </AdminTd>
                </tr>
              ))}
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-14 text-center text-admin-muted"
                  >
                    {loading
                      ? "Loading collections…"
                      : "No collections yet. Use the form on the right to create one."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </AdminTable>
        </div>

        {/* Form — right */}
        {showForm ? (
          <form
            onSubmit={submit}
            className="min-w-0 space-y-4 lg:sticky lg:top-4"
            noValidate
          >
            {editing ? (
              <div className="flex items-center justify-between gap-3 rounded-md border border-admin-line bg-admin-soft-2 px-4 py-3">
                <p className="min-w-0 text-sm text-admin-ink">
                  Editing <span className="font-semibold">{editing.title}</span>
                </p>
                <button
                  type="button"
                  onClick={resetForm}
                  className="shrink-0 cursor-pointer font-display text-[11px] font-medium uppercase tracking-[0.12em] text-admin-muted transition-colors hover:text-admin-ink"
                >
                  Cancel edit
                </button>
              </div>
            ) : null}
            <AdminFormSection
              title="Name and URL"
              description="Title customers see. Handle is the collection URL."
              tip="Handle becomes /collections/your-handle. Prefer simple slugs like for-him. It cannot change after create."
            >
              <div>
                <AdminFieldLabel tip="Display name in navigation and headers." required>
                  Title
                </AdminFieldLabel>
                <input
                  className={cn(
                    adminFieldClass,
                    errors.title && "border-rosewood",
                  )}
                  required
                  value={title}
                  onChange={(e) => {
                    const v = e.target.value;
                    setTitle(v);
                    if (!editing) {
                      setHandle(
                        v
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, "-")
                          .replace(/^-|-$/g, ""),
                      );
                    }
                  }}
                  placeholder="For him"
                />
                {errors.title ? (
                  <p className="mt-1 text-sm text-rosewood">{errors.title}</p>
                ) : null}
              </div>
              <div>
                <AdminFieldLabel
                  tip="Lowercase letters, numbers, hyphens only."
                  required
                >
                  Handle
                </AdminFieldLabel>
                <input
                  className={cn(
                    adminFieldClass,
                    errors.handle && "border-rosewood",
                  )}
                  required
                  disabled={Boolean(editing)}
                  value={handle}
                  onChange={(e) =>
                    setHandle(
                      e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                    )
                  }
                  placeholder="for-him"
                />
                {errors.handle ? (
                  <p className="mt-1 text-sm text-rosewood">{errors.handle}</p>
                ) : null}
                {handle ? (
                  <p className="mt-1 font-mono text-xs text-admin-faint">
                    /collections/{handle}
                  </p>
                ) : null}
              </div>
            </AdminFormSection>

            <AdminFormSection
              title="Copy and status"
              tip="Draft hides the collection from shop menus until you publish."
            >
              <div>
                <AdminRichTextEditor
                  label="Description"
                  tip="Short intro under the collection title. Optional."
                  value={description}
                  error={errors.description}
                  minHeightClass="min-h-28"
                  placeholder="Cedar, vetiver, and leather for daytime and desk."
                  onChange={setDescription}
                />
              </div>
              <Select
                label="Status"
                value={status}
                onValueChange={(v) => setStatus(v as "active" | "draft")}
                options={[
                  { value: "draft", label: "Draft (hidden)" },
                  { value: "active", label: "Published" },
                ]}
              />
            </AdminFormSection>

            <AdminFormSection
              title="Products"
              description="Hand-pick bottles for this collection."
              tip="Products also join when ticked under Categories on the product page, or when they match this collection's filter tags."
            >
              <AdminSearchableSelect
                label="Add product"
                value=""
                options={productOptions.filter(
                  (o) => !productHandles.includes(o.value),
                )}
                placeholder="Search products…"
                emptyLabel="No matching products."
                onChange={addProductHandle}
              />
              {productHandles.length ? (
                <ul className="space-y-1.5">
                  {productHandles.map((h) => (
                    <li
                      key={h}
                      className="flex items-center justify-between gap-3 rounded-md border border-admin-line bg-admin-soft-2 px-3 py-2"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-admin-ink">
                          {productLabel(h) || h}
                        </span>
                        <span className="block font-mono text-[11px] text-admin-faint">
                          {h}
                          {productOptions.length && !productLabel(h)
                            ? " · not in catalog"
                            : ""}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => removeProductHandle(h)}
                        className="shrink-0 cursor-pointer font-display text-[11px] font-medium uppercase tracking-wide text-admin-muted transition-colors hover:text-rosewood"
                        aria-label={`Remove ${productLabel(h) || h}`}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-admin-muted">
                  No hand-picked products.
                </p>
              )}
              {editing?.filterTags?.length ? (
                <p className="text-[13px] leading-relaxed text-admin-muted">
                  Also includes products tagged{" "}
                  <span className="font-mono text-admin-ink">
                    {editing.filterTags.join(", ")}
                  </span>
                  .
                </p>
              ) : null}
            </AdminFormSection>

            <AdminFormSection
              title="Banner image"
              description="Shown on collection cards and header where used."
              tip="Drop a file, click to upload, or paste a URL."
            >
              <AdminImageField
                label="Collection image"
                value={bannerImage}
                onChange={setBannerImage}
                hint="Wide or square both work"
                aspect="wide"
              />
              {errors.bannerImage ? (
                <p className="text-sm text-rosewood">{errors.bannerImage}</p>
              ) : null}
            </AdminFormSection>

            {formError ? (
              <p className="text-sm font-medium text-rosewood">{formError}</p>
            ) : null}
            <Button type="submit" disabled={saving} className="w-full">
              {saving
                ? editing
                  ? "Saving…"
                  : "Creating…"
                : editing
                  ? "Save collection"
                  : "Create collection"}
            </Button>
          </form>
        ) : (
          <div className="rounded-lg border border-dashed border-admin-line bg-admin-paper px-5 py-10 text-center lg:sticky lg:top-4">
            <p className="text-sm text-admin-muted">
              Form hidden. Open it to create a collection.
            </p>
            <Button
              type="button"
              className="mt-4"
              onClick={() => setShowForm(true)}
            >
              New collection
            </Button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(o) => {
          if (!o && !deleting) setDeleteTarget(null);
        }}
        title="Delete this collection?"
        description={
          deleteTarget
            ? `${deleteTarget.title} (/collections/${deleteTarget.handle}) will be removed from the storefront. Products stay in the catalog.`
            : "This collection will be removed."
        }
        confirmLabel="Delete collection"
        cancelLabel="Keep collection"
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </AdminShell>
  );
}
