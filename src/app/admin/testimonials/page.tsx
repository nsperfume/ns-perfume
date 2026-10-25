"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BrandLoaderBlock } from "@/components/brand/brand-loader";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  AdminFieldLabel,
  adminFieldClass,
} from "@/components/admin/form-section";
import {
  AdminActionDivider,
  AdminEmptyState,
  AdminFilterChips,
  AdminIcon,
  AdminIconAction,
  AdminModal,
  AdminNotice,
  AdminPageHeader,
  AdminStatusBadge,
} from "@/components/admin/ui";
import { Button } from "@/components/admin/button";
import { Select } from "@/components/admin/select";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { toast } from "@/components/admin/toast";
import {
  AdminFieldError,
  AdminFormError,
  useFormValidation,
  type FieldErrors,
} from "@/components/admin/form-validation";
import { useUnsavedChangesGuard } from "@/components/admin/unsaved-changes";
import { richTextToPlain } from "@/lib/rich-text";

type T = {
  _id: string;
  author: string;
  city?: string;
  quote: string;
  productName?: string;
  status?: string;
};

type FormState = {
  author: string;
  city: string;
  productName: string;
  quote: string;
  status: "published" | "draft";
};

const EMPTY_FORM: FormState = {
  author: "",
  city: "Karachi",
  productName: "",
  quote: "",
  status: "published",
};

/** Mirrors testimonialSchema in src/lib/validation/catalog.ts */
const testimonialFormSchema = z.object({
  author: z
    .string()
    .trim()
    .min(2, "Enter the customer's name")
    .max(80, "Keep the name under 80 characters"),
  city: z.string().trim().max(60, "Keep the city under 60 characters"),
  productName: z
    .string()
    .trim()
    .max(80, "Keep the product name under 80 characters"),
  quote: z
    .string()
    .trim()
    .min(1, "Write the quote")
    .min(10, "Write at least 10 characters")
    .max(600, "Keep the quote under 600 characters"),
});

/** Storefront wraps plain quotes in curly marks, so drop any typed ones. */
function cleanQuote(text: string) {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^["“”']+|["“”']+$/g, "")
    .trim();
}

async function readResult(res: Response) {
  const json = (await res.json().catch(() => null)) as {
    ok?: boolean;
    error?: string;
    details?: { fieldErrors?: FieldErrors };
  } | null;
  return {
    ok: Boolean(json?.ok),
    error:
      json?.error ||
      (res.ok ? "Unexpected response" : `Request failed (${res.status})`),
    fieldErrors: json?.details?.fieldErrors,
  };
}

export default function AdminTestimonialsPage() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [user, setUser] = useState<{
    email?: string;
    name?: string;
    role?: string;
    isSuperAdmin?: boolean;
  } | null>(null);
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [filter, setFilter] = useState("all");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [baseline, setBaseline] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [discardOpen, setDiscardOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [rowDelete, setRowDelete] = useState<T | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const v = useFormValidation(testimonialFormSchema);

  const canDelete = Boolean(
    user?.isSuperAdmin || user?.role === "super_admin",
  );
  const dirty = open && JSON.stringify(form) !== JSON.stringify(baseline);
  const leaveGuard = useUnsavedChangesGuard(dirty && !saving);

  function load() {
    setLoading(true);
    fetch("/api/testimonials?all=1")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) {
          setItems(j.data);
          setLoadError("");
        } else setLoadError(j.error || "Could not load testimonials");
      })
      .catch(() => setLoadError("Network error while loading testimonials"))
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
  }, [router]);

  const counts = useMemo(
    () => ({
      all: items.length,
      published: items.filter((t) => (t.status || "published") === "published")
        .length,
      draft: items.filter((t) => t.status === "draft").length,
    }),
    [items],
  );

  const visible = useMemo(
    () =>
      items.filter(
        (t) => filter === "all" || (t.status || "published") === filter,
      ),
    [items, filter],
  );

  function openForm(t: T | null) {
    const next: FormState = t
      ? {
          author: t.author,
          city: t.city || "",
          productName: t.productName || "",
          quote: cleanQuote(richTextToPlain(t.quote)),
          status: t.status === "draft" ? "draft" : "published",
        }
      : EMPTY_FORM;
    setEditing(t);
    setForm(next);
    setBaseline(next);
    setFormError("");
    v.reset();
    setOpen(true);
  }

  function closeForm() {
    setOpen(false);
    setDiscardOpen(false);
    setEditing(null);
  }

  function requestClose() {
    if (saving) return;
    if (dirty) setDiscardOpen(true);
    else closeForm();
  }

  function update(patch: Partial<FormState>) {
    const next = { ...form, ...patch };
    setForm(next);
    v.revalidate(next);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!v.validate(form, formRef.current)) return;
    const payload = {
      author: form.author.trim(),
      city: form.city.trim(),
      productName: form.productName.trim(),
      quote: cleanQuote(form.quote),
      status: form.status,
    };
    setSaving(true);
    try {
      const res = editing
        ? await fetch(`/api/testimonials/${editing._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/testimonials", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...payload, featured: true, rating: 5 }),
          });
      const result = await readResult(res);
      if (!result.ok) {
        if (result.fieldErrors) v.setErrors(result.fieldErrors);
        setFormError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success(editing ? "Testimonial saved" : "Testimonial added");
      setBaseline(form);
      closeForm();
      load();
    } catch {
      setFormError("Network error. Nothing was saved, try again.");
      toast.error("Network error. The testimonial was not saved.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleVisibility(t: T) {
    const next = t.status === "draft" ? "published" : "draft";
    setToggling(t._id);
    try {
      const res = await fetch(`/api/testimonials/${t._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const result = await readResult(res);
      if (!result.ok) {
        toast.error(result.error || "Could not update the testimonial");
        return;
      }
      toast.success(next === "published" ? "Shown on the homepage" : "Hidden from the homepage");
      setItems((prev) => prev.map((x) => (x._id === t._id ? { ...x, status: next } : x)));
    } catch {
      toast.error("Network error. Nothing was changed.");
    } finally {
      setToggling(null);
    }
  }

  async function deleteFromList() {
    if (!rowDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/testimonials/${rowDelete._id}`, {
        method: "DELETE",
      });
      const result = await readResult(res);
      if (!result.ok) {
        toast.error(result.error || "Could not delete the testimonial");
        return;
      }
      toast.success("Testimonial deleted");
      setRowDelete(null);
      load();
    } catch {
      toast.error("Network error. The testimonial was not deleted.");
    } finally {
      setDeleting(false);
    }
  }

  async function confirmDelete() {
    if (!editing) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/testimonials/${editing._id}`, {
        method: "DELETE",
      });
      const result = await readResult(res);
      if (!result.ok) {
        toast.error(result.error || "Could not delete the testimonial");
        return;
      }
      toast.success("Testimonial deleted");
      setDeleteOpen(false);
      setBaseline(form);
      closeForm();
      load();
    } catch {
      toast.error("Network error. The testimonial was not deleted.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AdminShell user={user}>
      <AdminPageHeader
        title="Testimonials"
        action={
          <Button type="button" onClick={() => openForm(null)}>
            Add testimonial
          </Button>
        }
      />

      {loadError ? (
        <AdminNotice tone="error" onDismiss={() => setLoadError("")}>
          {loadError}
        </AdminNotice>
      ) : null}

      <AdminFilterChips
        className="mb-4"
        label="Filter testimonials"
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all", label: "All", count: counts.all },
          { value: "published", label: "On homepage", count: counts.published },
          { value: "draft", label: "Hidden", count: counts.draft },
        ]}
      />

      {visible.length ? (
        <ul className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {visible.map((t) => (
            <li
              key={t._id}
              className="flex h-full flex-col rounded-lg border border-admin-line bg-admin-paper shadow-admin transition-colors hover:border-admin-faint"
            >
              <button
                type="button"
                onClick={() => openForm(t)}
                className="flex flex-1 cursor-pointer flex-col p-5 pb-4 text-left"
                aria-label={`Edit testimonial from ${t.author}`}
              >
                <p className="flex-1 text-[0.9375rem] leading-relaxed text-admin-ink">
                  “{cleanQuote(richTextToPlain(t.quote))}”
                </p>
                <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-admin-ink">{t.author}</p>
                    <p className="text-[0.8125rem] text-admin-muted">
                      {[t.city, t.productName].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <AdminStatusBadge
                    status={t.status || "published"}
                    label={t.status === "draft" ? "Hidden" : "On homepage"}
                  />
                </div>
              </button>
              <div className="flex items-center gap-1 border-t border-admin-line px-3 py-2">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={toggling === t._id}
                  onClick={() => toggleVisibility(t)}
                  className="text-admin-ink!"
                >
                  <AdminIcon name={t.status === "draft" ? "publish" : "hide"} size={17} />
                  {t.status === "draft" ? "Show on homepage" : "Hide"}
                </Button>
                <span className="ml-auto flex items-center">
                  <AdminIconAction
                    icon="edit"
                    label="Edit testimonial"
                    ariaLabel={`Edit testimonial from ${t.author}`}
                    onClick={() => openForm(t)}
                  />
                  {canDelete ? (
                    <>
                      <AdminActionDivider />
                      <AdminIconAction
                        icon="delete"
                        tone="danger"
                        label="Delete testimonial"
                        ariaLabel={`Delete testimonial from ${t.author}`}
                        onClick={() => setRowDelete(t)}
                      />
                    </>
                  ) : null}
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-lg border border-admin-line bg-admin-paper shadow-admin">
          {loading ? (
            <BrandLoaderBlock className="min-h-[40vh]" label="Loading testimonials" />
          ) : items.length ? (
            <AdminEmptyState
              title="Nothing in this filter"
              action={
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="w-auto!"
                  onClick={() => setFilter("all")}
                >
                  Show all
                </Button>
              }
            />
          ) : (
            <AdminEmptyState
              title="No testimonials yet"
              description="Add a few kind words from customers for the homepage."
              action={
                <Button type="button" onClick={() => openForm(null)}>
                  Add testimonial
                </Button>
              }
            />
          )}
        </div>
      )}

      <AdminModal
        open={open}
        onClose={requestClose}
        title={editing ? "Edit testimonial" : "Add testimonial"}
        size="lg"
      >
        <form ref={formRef} onSubmit={save} noValidate className="space-y-5">
          {formError ? <AdminFormError>{formError}</AdminFormError> : null}
          <div>
            <AdminFieldLabel htmlFor="t-quote" required>
              Quote
            </AdminFieldLabel>
            <textarea
              id="t-quote"
              name="quote"
              rows={4}
              className={`${adminFieldClass} min-h-28 resize-y leading-relaxed`}
              value={form.quote}
              aria-invalid={v.errors.quote ? true : undefined}
              onChange={(e) => update({ quote: e.target.value })}
              onBlur={() => v.revalidate(form)}
              placeholder="Lasts all day in the heat. Everyone asks what I am wearing."
              maxLength={620}
            />
            <AdminFieldError message={v.errors.quote} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <AdminFieldLabel htmlFor="t-author" required>
                Customer name
              </AdminFieldLabel>
              <input
                id="t-author"
                name="author"
                className={adminFieldClass}
                value={form.author}
                aria-invalid={v.errors.author ? true : undefined}
                onChange={(e) => update({ author: e.target.value })}
                onBlur={() => v.revalidate(form)}
                maxLength={80}
              />
              <AdminFieldError message={v.errors.author} />
            </div>
            <div>
              <AdminFieldLabel htmlFor="t-city">City</AdminFieldLabel>
              <input
                id="t-city"
                name="city"
                className={adminFieldClass}
                value={form.city}
                aria-invalid={v.errors.city ? true : undefined}
                onChange={(e) => update({ city: e.target.value })}
                onBlur={() => v.revalidate(form)}
                maxLength={60}
              />
              <AdminFieldError message={v.errors.city} />
            </div>
            <div>
              <AdminFieldLabel htmlFor="t-product">Product</AdminFieldLabel>
              <input
                id="t-product"
                name="productName"
                className={adminFieldClass}
                value={form.productName}
                aria-invalid={v.errors.productName ? true : undefined}
                onChange={(e) => update({ productName: e.target.value })}
                onBlur={() => v.revalidate(form)}
                placeholder="Amber Noir"
                maxLength={80}
              />
              <AdminFieldError message={v.errors.productName} />
            </div>
            <Select
              label="Visibility"
              value={form.status}
              onValueChange={(s) =>
                update({ status: s as "published" | "draft" })
              }
              options={[
                { value: "published", label: "On homepage" },
                { value: "draft", label: "Hidden" },
              ]}
            />
          </div>
          <div className="flex flex-col-reverse gap-2 border-t border-admin-line pt-5 sm:flex-row sm:items-center sm:justify-between">
            {editing && canDelete ? (
              <Button
                type="button"
                variant="danger-outline"
                size="sm"
                className="sm:w-auto!"
                disabled={saving}
                onClick={() => setDeleteOpen(true)}
              >
                Delete
              </Button>
            ) : (
              <span className="hidden sm:block" />
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button
                type="button"
                variant="secondary"
                disabled={saving}
                onClick={requestClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving || (Boolean(editing) && !dirty)}
              >
                {saving ? "Saving…" : editing ? "Save" : "Add testimonial"}
              </Button>
            </div>
          </div>
        </form>
      </AdminModal>

      <ConfirmDialog
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        title="Discard unsaved changes?"
        description="Your edits to this testimonial will be lost."
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        onConfirm={closeForm}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={(o) => {
          if (!o && !deleting) setDeleteOpen(false);
        }}
        title="Delete this testimonial?"
        description={
          editing
            ? `The quote from ${editing.author} will be removed for good.`
            : "This testimonial will be removed for good."
        }
        confirmLabel="Delete testimonial"
        cancelLabel="Keep testimonial"
        loading={deleting}
        onConfirm={confirmDelete}
      />
      <ConfirmDialog
        open={rowDelete !== null}
        onOpenChange={(o) => {
          if (!o && !deleting) setRowDelete(null);
        }}
        title="Delete this testimonial?"
        description={
          rowDelete
            ? `The quote from ${rowDelete.author} will be removed. This cannot be undone.`
            : "This testimonial will be removed."
        }
        confirmLabel="Delete testimonial"
        cancelLabel="Keep it"
        loading={deleting}
        onConfirm={deleteFromList}
      />
      {leaveGuard}
    </AdminShell>
  );
}
