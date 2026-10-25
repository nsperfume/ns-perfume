"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import slugify from "slugify";
import { z } from "zod";
import { format, isValid, parseISO } from "date-fns";
import { ChevronsLeftIcon } from "@animateicons/react/lucide";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminImageField } from "@/components/admin/image-field";
import { AdminDatePickerField } from "@/components/admin/date-picker-field";
import {
  AdminSearchableSelect,
  type SearchableOption,
} from "@/components/admin/searchable-select";
import { AdminRichTextEditor } from "@/components/admin/rich-text-editor";
import {
  AdminFieldLabel,
  AdminFormSection,
  adminFieldClass,
} from "@/components/admin/form-section";
import {
  AdminEmptyState,
  AdminFilterChips,
  AdminNotice,
  AdminPageHeader,
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

type FormState = {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  date: string;
  category: string;
  relatedProductHandle: string;
  relatedCollectionHandle: string;
  imageUrl: string;
  status: "published" | "draft";
};

const CATEGORY_OPTIONS = [
  { value: "Guides", label: "Guides" },
  { value: "Wear", label: "Wear" },
  { value: "Gifting", label: "Gifting" },
  { value: "Climate", label: "Climate" },
  { value: "Notes", label: "Notes" },
];

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Mirrors /api/journal: title and web address required; body and date required for a usable post. */
const journalSchema = z.object({
  title: z.string().trim().min(2, "Enter a title"),
  slug: z
    .string()
    .trim()
    .min(2, "Add a web address of at least 2 letters or numbers")
    .regex(SLUG_RE, "Use lowercase letters, numbers and single hyphens"),
  bodyText: z
    .string()
    .trim()
    .min(1, "Write the post")
    .min(40, "Write at least a short paragraph (40 characters)"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a publish date"),
  excerpt: z.string().trim().max(300, "Keep the summary under 300 characters"),
});

/** Today's calendar date in Pakistan as yyyy-MM-dd (en-CA formats that way). */
function todayInKarachi() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function emptyForm(): FormState {
  return {
    title: "",
    slug: "",
    excerpt: "",
    body: "",
    date: todayInKarachi(),
    category: "Guides",
    relatedProductHandle: "",
    relatedCollectionHandle: "",
    imageUrl: "",
    status: "published",
  };
}

function toSlug(text: string) {
  return slugify(text, { lower: true, strict: true, trim: true });
}

/** Reading time from the body (about 200 words a minute). */
function readTimeFor(plain: string) {
  const words = plain.split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200))} min`;
}

/** Card summary from the opening lines when none is written. */
function autoExcerpt(plain: string) {
  const text = plain.replace(/\s+/g, " ").trim();
  if (text.length <= 180) return text;
  const cut = text.slice(0, 180);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 120 ? cut.lastIndexOf(" ") : 180)}…`;
}

function formatPostDate(iso: string) {
  const d = parseISO(iso);
  return isValid(d) ? format(d, "d MMM yyyy") : iso || "";
}

export default function AdminJournalPage() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [user, setUser] = useState<{
    email?: string;
    name?: string;
    role?: string;
    isSuperAdmin?: boolean;
  } | null>(null);
  const [items, setItems] = useState<JournalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [productOptions, setProductOptions] = useState<SearchableOption[]>([]);
  const [collectionOptions, setCollectionOptions] = useState<
    SearchableOption[]
  >([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  // Editor
  const [mode, setMode] = useState<"list" | "edit">("list");
  const [editing, setEditing] = useState<JournalRow | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [baseline, setBaseline] = useState<FormState>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [urlOpen, setUrlOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [discardOpen, setDiscardOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const v = useFormValidation(journalSchema);

  const canDelete = Boolean(
    user?.isSuperAdmin || user?.role === "super_admin",
  );
  const dirty =
    mode === "edit" && JSON.stringify(form) !== JSON.stringify(baseline);
  const leaveGuard = useUnsavedChangesGuard(dirty && !saving);

  function load() {
    setLoading(true);
    fetch("/api/journal?all=1")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) {
          setItems(j.data);
          setLoadError("");
        } else setLoadError(j.error || "Could not load posts");
      })
      .catch(() => setLoadError("Network error while loading posts"))
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
      })
      .catch(() => {
        /* picker stays empty */
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
              hint: c.status === "draft" ? "Draft" : undefined,
            }),
          ),
        );
      })
      .catch(() => {
        /* picker stays empty */
      });
  }, [router]);

  const counts = useMemo(
    () => ({
      all: items.length,
      published: items.filter((p) => p.status === "published").length,
      draft: items.filter((p) => p.status === "draft").length,
    }),
    [items],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((p) => {
      if (filter !== "all" && p.status !== filter) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }, [items, query, filter]);

  function scrollTop() {
    document
      .getElementById("admin-main-scroll")
      ?.scrollTo({ top: 0, behavior: "smooth" });
  }

  function rowToForm(row: JournalRow): FormState {
    return {
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt,
      body: row.bodyHtml || toRichHtml(row.body),
      date: row.date || todayInKarachi(),
      category: row.category || "Guides",
      relatedProductHandle: row.relatedProductHandle,
      relatedCollectionHandle: row.relatedCollectionHandle,
      imageUrl: row.imageUrl,
      status: row.status,
    };
  }

  function openEditor(row: JournalRow | null) {
    const next = row ? rowToForm(row) : emptyForm();
    setEditing(row);
    setForm(next);
    setBaseline(next);
    setSlugTouched(Boolean(row));
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
      // An unchanged address on an existing post is already live; only check edits.
      slug:
        (editing && f.slug === editing.slug) || (!slugTouched && !f.title.trim())
          ? "unchanged"
          : f.slug,
      bodyText: richTextToPlain(f.body),
      date: f.date,
      excerpt: f.excerpt,
    };
  }

  function update(patch: Partial<FormState>) {
    const next = { ...form, ...patch };
    if (patch.title !== undefined && !slugTouched) {
      next.slug = toSlug(patch.title);
    }
    setForm(next);
    v.revalidate(validationValues(next));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    const values = validationValues();
    if (!v.validate(values, formRef.current)) {
      const parsed = journalSchema.safeParse(values);
      if (!parsed.success && parsed.error.issues.some((i) => i.path[0] === "slug")) {
        setUrlOpen(true);
      }
      return;
    }
    const plain = richTextToPlain(form.body);
    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      excerpt: form.excerpt.trim() || autoExcerpt(plain),
      body: form.body,
      date: form.date,
      readTime: readTimeFor(plain),
      category: form.category || "Guides",
      relatedProductHandle: form.relatedProductHandle.trim(),
      relatedCollectionHandle: form.relatedCollectionHandle.trim(),
      imageUrl: form.imageUrl.trim(),
      status: form.status,
    };
    setSaving(true);
    try {
      const res = await fetch(
        editing ? `/api/journal/${editing.id}` : "/api/journal",
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const json = await readAdminJson<JournalRow>(res);
      if (!json.ok) {
        const message = json.error || "Could not save the post";
        setFormError(message);
        if (/slug/i.test(message)) {
          setUrlOpen(true);
          v.setErrors({ slug: "This web address is already used by another post" });
        }
        toast.error(message);
        return;
      }
      toast.success(
        editing
          ? "Post saved"
          : form.status === "published"
            ? "Post published"
            : "Draft saved",
      );
      if (json.data) {
        const next = rowToForm(json.data);
        setEditing(json.data);
        setForm(next);
        setBaseline(next);
        setSlugTouched(true);
        setUrlOpen(false);
      } else {
        setBaseline(form);
      }
      load();
    } catch {
      setFormError("Network error. Your text is still here, try again.");
      toast.error("Network error. The post was not saved.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!editing) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/journal/${editing.id}`, { method: "DELETE" });
      const json = await readAdminJson(res);
      if (!json.ok) {
        toast.error(json.error || "Could not delete the post");
        return;
      }
      toast.success("Post deleted");
      setDeleteOpen(false);
      setBaseline(form);
      closeEditor();
      load();
    } catch {
      toast.error("Network error. The post was not deleted.");
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
    const saveLabel = saving
      ? "Saving…"
      : editing
        ? "Save"
        : form.status === "published"
          ? "Publish post"
          : "Save draft";
    return shell(
      <>
        <button
          type="button"
          onClick={requestClose}
          className="-ml-1.5 mb-3 inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-md px-1.5 text-sm font-semibold text-admin-muted transition-colors hover:bg-admin-soft hover:text-admin-ink"
        >
          <ChevronsLeftIcon size={16} color="currentColor" isAnimated={false} />
          Journal
        </button>
        <AdminPageHeader
          title={editing ? editing.title : "New post"}
          action={
            <Button
              type="submit"
              form="journal-form"
              disabled={saving || (Boolean(editing) && !dirty)}
              className="max-sm:hidden!"
            >
              {saveLabel}
            </Button>
          }
        />

        <form
          id="journal-form"
          ref={formRef}
          onSubmit={save}
          noValidate
          className="grid gap-6 pb-24 sm:pb-0 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start 2xl:grid-cols-[minmax(0,1fr)_24rem]"
        >
          <div className="min-w-0 space-y-6">
            {formError ? <AdminFormError>{formError}</AdminFormError> : null}

            <AdminFormSection title="Post">
              <div>
                <AdminFieldLabel htmlFor="journal-title" required>
                  Title
                </AdminFieldLabel>
                <input
                  id="journal-title"
                  name="title"
                  className={adminFieldClass}
                  value={form.title}
                  aria-invalid={v.errors.title ? true : undefined}
                  onChange={(e) => update({ title: e.target.value })}
                  onBlur={() => v.revalidate(validationValues())}
                  placeholder="How to make oud last through a Karachi summer"
                  maxLength={160}
                />
                <AdminFieldError message={v.errors.title} />
              </div>
              <div data-field="bodyText">
                <AdminRichTextEditor
                  label="Body"
                  required
                  value={form.body}
                  error={v.errors.bodyText}
                  minHeightClass="min-h-72"
                  placeholder="Write the post. Short paragraphs read best."
                  onChange={(body) => update({ body })}
                />
              </div>
              <div>
                <AdminFieldLabel htmlFor="journal-excerpt">Summary</AdminFieldLabel>
                <textarea
                  id="journal-excerpt"
                  name="excerpt"
                  rows={3}
                  className={`${adminFieldClass} min-h-24 resize-y leading-relaxed`}
                  value={form.excerpt}
                  aria-invalid={v.errors.excerpt ? true : undefined}
                  onChange={(e) => update({ excerpt: e.target.value })}
                  onBlur={() => v.revalidate(validationValues())}
                  placeholder="Leave blank to use the opening lines"
                  maxLength={320}
                />
                <AdminFieldError message={v.errors.excerpt} />
              </div>
            </AdminFormSection>

            <AdminFormSection title="Related">
              <div className="grid gap-5 md:grid-cols-2">
                <AdminSearchableSelect
                  label="Product"
                  value={form.relatedProductHandle}
                  options={productOptions}
                  placeholder="Search products"
                  emptyLabel="No matching products."
                  onChange={(relatedProductHandle) =>
                    update({ relatedProductHandle })
                  }
                />
                <AdminSearchableSelect
                  label="Collection"
                  value={form.relatedCollectionHandle}
                  options={collectionOptions}
                  placeholder="Search collections"
                  emptyLabel="No matching collections."
                  onChange={(relatedCollectionHandle) =>
                    update({ relatedCollectionHandle })
                  }
                />
              </div>
            </AdminFormSection>
          </div>

          <aside className="min-w-0 space-y-6 lg:sticky lg:top-4">
            <AdminFormSection title="Visibility">
              <Select
                label="Status"
                value={form.status}
                onValueChange={(s) =>
                  update({ status: s as "published" | "draft" })
                }
                options={[
                  { value: "published", label: "Published" },
                  { value: "draft", label: "Draft (hidden from shop)" },
                ]}
              />
              <AdminDatePickerField
                label="Publish date"
                name="date"
                required
                value={form.date}
                error={v.errors.date}
                onChange={(date) => update({ date })}
                onBlur={() => v.revalidate(validationValues())}
              />
              <Select
                label="Category"
                value={form.category}
                onValueChange={(category) => update({ category })}
                options={CATEGORY_OPTIONS}
              />
              <div>
                <p className="text-sm font-semibold text-admin-ink">Web address</p>
                <p className="mt-1 break-all text-[0.9375rem] text-admin-muted">
                  /journal/{form.slug || "…"}
                </p>
                {urlOpen ? (
                  <div className="mt-3">
                    <AdminFieldLabel htmlFor="journal-slug">
                      Edit web address
                    </AdminFieldLabel>
                    <input
                      id="journal-slug"
                      name="slug"
                      className={adminFieldClass}
                      value={form.slug}
                      aria-invalid={v.errors.slug ? true : undefined}
                      onChange={(e) => {
                        setSlugTouched(true);
                        update({
                          slug: e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9-]/g, ""),
                        });
                      }}
                      onBlur={() => v.revalidate(validationValues())}
                      maxLength={100}
                    />
                    <AdminFieldError message={v.errors.slug} />
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setUrlOpen(true)}
                      className="mt-1 cursor-pointer text-sm font-semibold text-admin-accent hover:underline"
                    >
                      Edit URL
                    </button>
                    <AdminFieldError message={v.errors.slug} />
                  </>
                )}
              </div>
            </AdminFormSection>

            <AdminFormSection title="Cover image">
              <AdminImageField
                label="Image"
                value={form.imageUrl}
                aspect="wide"
                onChange={(imageUrl) => update({ imageUrl })}
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
                  Delete post
                </Button>
              </div>
            ) : null}
          </aside>

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
          description="Your edits to this post will be lost."
          confirmLabel="Discard changes"
          cancelLabel="Keep editing"
          onConfirm={closeEditor}
        />
        <ConfirmDialog
          open={deleteOpen}
          onOpenChange={(o) => {
            if (!o && !deleting) setDeleteOpen(false);
          }}
          title="Delete this post?"
          description={
            editing
              ? `"${editing.title}" will be removed from the journal for good.`
              : "This post will be removed for good."
          }
          confirmLabel="Delete post"
          cancelLabel="Keep post"
          loading={deleting}
          onConfirm={confirmDelete}
        />
      </>,
    );
  }

  /* ----------------------------- List view ----------------------------- */
  return shell(
    <>
      <AdminPageHeader
        title="Journal"
        action={
          <Button type="button" onClick={() => openEditor(null)}>
            Write post
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
          label="Filter posts"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All", count: counts.all },
            { value: "published", label: "Published", count: counts.published },
            { value: "draft", label: "Draft", count: counts.draft },
          ]}
        />
        <AdminSearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search posts"
          className="w-full md:w-72"
        />
      </div>

      <AdminTable compact>
        <thead>
          <tr>
            <AdminTh>Post</AdminTh>
            <AdminTh className="hidden md:table-cell">Category</AdminTh>
            <AdminTh className="hidden sm:table-cell">Date</AdminTh>
            <AdminTh className="w-32">Status</AdminTh>
          </tr>
        </thead>
        <tbody>
          {visible.map((post) => (
            <tr
              key={post.id}
              tabIndex={0}
              onClick={() => openEditor(post)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openEditor(post);
                }
              }}
              aria-label={`Edit ${post.title}`}
              className="cursor-pointer outline-none transition-colors hover:bg-admin-soft-2 focus-visible:bg-admin-soft-2"
            >
              <AdminTd>
                <div className="flex items-center gap-3">
                  <div className="hidden h-11 w-16 shrink-0 overflow-hidden rounded-md border border-admin-line bg-admin-soft sm:block">
                    {post.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-admin-ink">{post.title}</p>
                    <p className="line-clamp-1 text-[0.8125rem] text-admin-muted">
                      <span className="sm:hidden">
                        {formatPostDate(post.date)}
                        {post.excerpt ? " · " : ""}
                      </span>
                      {post.excerpt}
                    </p>
                  </div>
                </div>
              </AdminTd>
              <AdminTd className="hidden whitespace-nowrap text-admin-muted md:table-cell">
                {post.category}
              </AdminTd>
              <AdminTd className="hidden whitespace-nowrap tabular-nums text-admin-muted sm:table-cell">
                {formatPostDate(post.date)}
              </AdminTd>
              <AdminTd>
                <AdminStatusBadge status={post.status} />
              </AdminTd>
            </tr>
          ))}
          {!visible.length ? (
            <tr>
              <td colSpan={4}>
                {loading ? (
                  <p className="px-6 py-14 text-center text-admin-muted">
                    Loading posts…
                  </p>
                ) : items.length ? (
                  <AdminEmptyState
                    title="No posts match"
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
                    title="No journal posts yet"
                    description="Share wearing tips, gifting ideas and new arrivals."
                    action={
                      <Button type="button" onClick={() => openEditor(null)}>
                        Write post
                      </Button>
                    }
                  />
                )}
              </td>
            </tr>
          ) : null}
        </tbody>
      </AdminTable>
    </>,
  );
}
