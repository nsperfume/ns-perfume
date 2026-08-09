"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import slugify from "slugify";
import { z } from "zod";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminImageField } from "@/components/admin/image-field";
import { AdminDatePickerField } from "@/components/admin/date-picker-field";
import { AdminColorPickerField } from "@/components/admin/color-picker-field";
import {
  AdminSearchableSelect,
  type SearchableOption,
} from "@/components/admin/searchable-select";
import { AdminRichTextEditor } from "@/components/admin/rich-text-editor";
import {
  AdminCard,
  AdminPageHeader,
  AdminStatusBadge,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { richTextToPlain, toRichHtml } from "@/lib/rich-text";

type JournalRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string[];
  bodyHtml: string;
  date: string;
  readTime: string;
  category: string;
  relatedProductHandle: string;
  relatedCollectionHandle: string;
  imageUrl: string;
  imageTone: string;
  status: "published" | "draft";
};

const emptyForm = {
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  date: new Date().toISOString().slice(0, 10),
  readTime: "5 min",
  category: "",
  relatedProductHandle: "",
  relatedCollectionHandle: "",
  imageUrl: "",
  imageTone: "#E8DFC8",
  status: "published" as "published" | "draft",
};

const schema = z.object({
  title: z.string().trim().min(4, "Title is required"),
  slug: z
    .string()
    .trim()
    .min(2, "Slug is required")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, hyphens"),
  excerpt: z.string().trim().min(20, "Excerpt needs more detail"),
  body: z.string().trim().min(1, "Add article content"),
  date: z.string().trim().min(8, "Date is required"),
  readTime: z.string().trim().min(2),
  category: z.string().trim().min(1, "Choose a category"),
  relatedProductHandle: z.string().trim().optional(),
  relatedCollectionHandle: z.string().trim().optional(),
  imageUrl: z.string().trim().optional(),
  imageTone: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Use a hex color like #E8DFC8"),
  status: z.enum(["published", "draft"]),
});

export default function AdminJournalPage() {
  const router = useRouter();
  const [user, setUser] = useState<{
    email?: string;
    name?: string;
    role?: string;
    isSuperAdmin?: boolean;
  } | null>(null);
  const [items, setItems] = useState<JournalRow[]>([]);
  const [productOptions, setProductOptions] = useState<SearchableOption[]>([]);
  const [collectionOptions, setCollectionOptions] = useState<
    SearchableOption[]
  >([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  const canDelete = Boolean(
    user?.isSuperAdmin || user?.role === "super_admin",
  );

  const categoryOptions = useMemo(
    () => [
      { value: "Guides", label: "Guides" },
      { value: "Wear", label: "Wear" },
      { value: "Gifting", label: "Gifting" },
      { value: "Climate", label: "Climate" },
      { value: "Notes", label: "Notes" },
    ],
    [],
  );

  const statusOptions = useMemo(
    () => [
      { value: "published", label: "Published" },
      { value: "draft", label: "Draft" },
    ],
    [],
  );

  function load() {
    fetch("/api/journal?all=1")
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

    fetch("/api/products?all=1")
      .then((r) => r.json())
      .then((j) => {
        if (!j.ok) return;
        setProductOptions(
          (j.data as { handle: string; name: string; concentration?: string }[]).map(
            (p) => ({
              value: p.handle,
              label: p.name,
              hint: p.concentration || undefined,
            }),
          ),
        );
      });

    fetch("/api/collections?all=1")
      .then((r) => r.json())
      .then((j) => {
        if (!j.ok) return;
        setCollectionOptions(
          (j.data as { handle: string; title: string; status?: string }[]).map(
            (c) => ({
              value: c.handle,
              label: c.title,
              hint: c.status || undefined,
            }),
          ),
        );
      });
  }, [router]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setSlugTouched(false);
    setErrors({});
  }

  function startEdit(row: JournalRow) {
    setEditingId(row.id);
    setSlugTouched(true);
    setErrors({});
    setForm({
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt,
      body: row.bodyHtml || toRichHtml(row.body),
      date: row.date,
      readTime: row.readTime,
      category: row.category,
      relatedProductHandle: row.relatedProductHandle,
      relatedCollectionHandle: row.relatedCollectionHandle,
      imageUrl: row.imageUrl,
      imageTone: row.imageTone,
      status: row.status,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    const plainBody = richTextToPlain(form.body);
    if (plainBody.length < 40) {
      setErrors({ body: "Add at least one full paragraph" });
      return;
    }
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const k = String(issue.path[0] || "form");
        if (!next[k]) next[k] = issue.message;
      }
      setErrors(next);
      return;
    }
    setSaving(true);
    try {
      const payload = { ...parsed.data };
      const res = await fetch(
        editingId ? `/api/journal/${editingId}` : "/api/journal",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const json = await res.json();
      if (json.ok) {
        resetForm();
        load();
      } else {
        setErrors({ form: json.error || "Could not save" });
      }
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await fetch(`/api/journal/${deleteId}`, { method: "DELETE" });
      if (editingId === deleteId) resetForm();
      setDeleteId(null);
      load();
    } finally {
      setDeleting(false);
    }
  }

  const pending = items.find((t) => t.id === deleteId);

  return (
    <AdminShell user={user}>
      <AdminPageHeader
        title="Journal"
        description="Editorial notes for the storefront. Published posts appear on Recent notes and /journal."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,28rem)_1fr]">
        <AdminCard title={editingId ? "Edit post" : "Write post"}>
          <form className="space-y-4 p-5" onSubmit={save} noValidate>
            {errors.form ? (
              <p className="text-sm text-[#b42318]">{errors.form}</p>
            ) : null}
            <Input
              label="Title"
              required
              value={form.title}
              error={errors.title}
              onChange={(e) => {
                const title = e.target.value;
                setForm((prev) => ({
                  ...prev,
                  title,
                  slug: slugTouched
                    ? prev.slug
                    : slugify(title, {
                        lower: true,
                        strict: true,
                        trim: true,
                      }),
                }));
              }}
            />
            <Input
              label="Slug"
              required
              value={form.slug}
              error={errors.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setForm({ ...form, slug: e.target.value });
              }}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <AdminDatePickerField
                label="Date"
                required
                value={form.date}
                error={errors.date}
                onChange={(date) => setForm({ ...form, date })}
              />
              <Input
                label="Read time"
                value={form.readTime}
                error={errors.readTime}
                onChange={(e) =>
                  setForm({ ...form, readTime: e.target.value })
                }
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Select
                  label="Category"
                  placeholder="Select category"
                  value={form.category}
                  onValueChange={(category) => setForm({ ...form, category })}
                  options={categoryOptions}
                  triggerClassName="border-[var(--admin-input-border)] bg-[var(--admin-soft-2)] text-[var(--admin-ink)] hover:border-[var(--admin-muted)] data-[state=open]:border-brass"
                />
                {errors.category ? (
                  <p className="mt-1.5 text-sm text-rosewood">
                    {errors.category}
                  </p>
                ) : null}
              </div>
              <Select
                label="Status"
                value={form.status}
                onValueChange={(status) =>
                  setForm({
                    ...form,
                    status: status as "published" | "draft",
                  })
                }
                options={statusOptions}
                triggerClassName="border-[var(--admin-input-border)] bg-[var(--admin-soft-2)] text-[var(--admin-ink)] hover:border-[var(--admin-muted)] data-[state=open]:border-brass"
              />
            </div>
            <Textarea
              label="Excerpt"
              required
              rows={5}
              className="min-h-32"
              value={form.excerpt}
              error={errors.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
            />
            <AdminRichTextEditor
              label="Article body"
              required
              tip="Full article copy. Use headings and lists when they help scanning."
              value={form.body}
              error={errors.body}
              minHeightClass="min-h-56"
              onChange={(body) => setForm({ ...form, body })}
            />
            <AdminImageField
              label="Cover image"
              value={form.imageUrl}
              aspect="wide"
              onChange={(imageUrl) => setForm({ ...form, imageUrl })}
              hint="Optional. Falls back to image tone when empty."
            />
            <AdminColorPickerField
              label="Image tone"
              tip="Fallback swatch when no cover image is set."
              value={form.imageTone}
              error={errors.imageTone}
              onChange={(imageTone) => setForm({ ...form, imageTone })}
            />
            <AdminSearchableSelect
              label="Related product"
              tip="Search by name or handle. You can also type a custom handle."
              value={form.relatedProductHandle}
              options={productOptions}
              placeholder="Search products…"
              onChange={(relatedProductHandle) =>
                setForm({ ...form, relatedProductHandle })
              }
            />
            <AdminSearchableSelect
              label="Related collection"
              tip="Search by title or handle. You can also type a custom handle."
              value={form.relatedCollectionHandle}
              options={collectionOptions}
              placeholder="Search collections…"
              onChange={(relatedCollectionHandle) =>
                setForm({ ...form, relatedCollectionHandle })
              }
            />
            <div className="flex flex-wrap gap-2 pt-1">
              <Button type="submit" disabled={saving} className="min-w-32">
                {saving
                  ? "Saving…"
                  : editingId
                    ? "Update post"
                    : "Publish post"}
              </Button>
              {editingId ? (
                <Button type="button" variant="secondary" onClick={resetForm}>
                  Cancel edit
                </Button>
              ) : null}
            </div>
          </form>
        </AdminCard>

        <ul className="space-y-3">
          {items.map((post) => (
            <li
              key={post.id}
              className="rounded-lg border border-[var(--admin-line)] bg-[var(--admin-paper)] p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-[var(--admin-ink)]">
                      {post.title}
                    </p>
                    <AdminStatusBadge status={post.status} />
                    <span className="text-xs uppercase tracking-wide text-[var(--admin-faint)]">
                      {post.category}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-xs text-[var(--admin-muted)]">
                    /journal/{post.slug} · {post.date} · {post.readTime}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--admin-muted)]">
                    {post.excerpt}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => startEdit(post)}
                    className="cursor-pointer font-display text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--admin-muted)] transition-colors hover:text-[var(--admin-ink)]"
                  >
                    Edit
                  </button>
                  {canDelete ? (
                    <button
                      type="button"
                      onClick={() => setDeleteId(post.id)}
                      className="cursor-pointer font-display text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--admin-muted)] transition-colors hover:text-[var(--admin-danger)]"
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
          {!items.length ? (
            <li className="rounded-lg border border-dashed border-[var(--admin-line)] p-8 text-center text-sm text-[var(--admin-muted)]">
              No journal posts yet. Write the first note on the left.
            </li>
          ) : null}
        </ul>
      </div>

      <ConfirmDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
        title="Delete journal post?"
        description={
          pending
            ? `Remove “${pending.title}” from the storefront permanently.`
            : "This cannot be undone."
        }
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </AdminShell>
  );
}
