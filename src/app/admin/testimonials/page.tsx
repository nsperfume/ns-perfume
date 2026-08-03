"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  AdminCard,
  AdminPageHeader,
  AdminStatusBadge,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type T = {
  _id: string;
  author: string;
  city?: string;
  quote: string;
  productName?: string;
  status?: string;
};

const schema = z.object({
  author: z.string().trim().min(2, "Name is required"),
  city: z.string().trim().max(80).optional(),
  productName: z.string().trim().max(120).optional(),
  quote: z.string().trim().min(12, "Quote needs at least 12 characters"),
});

export default function AdminTestimonialsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{
    email?: string;
    name?: string;
    role?: string;
    isSuperAdmin?: boolean;
  } | null>(null);
  const [items, setItems] = useState<T[]>([]);
  const [form, setForm] = useState({
    author: "",
    city: "Karachi",
    quote: "",
    productName: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const canDelete = Boolean(
    user?.isSuperAdmin || user?.role === "super_admin",
  );

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
    setErrors({});
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
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...parsed.data,
          featured: true,
          status: "published",
          rating: 5,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setForm({ author: "", city: "Karachi", quote: "", productName: "" });
        load();
      }
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await fetch(`/api/testimonials/${deleteId}`, { method: "DELETE" });
      setDeleteId(null);
      load();
    } finally {
      setDeleting(false);
    }
  }

  const pending = items.find((t) => t._id === deleteId);

  return (
    <AdminShell user={user}>
      <AdminPageHeader
        title="Testimonials"
        description="Homepage quotes. Separate from product-page reviews."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <AdminCard title="Add testimonial">
          <form className="space-y-4 p-5" onSubmit={create} noValidate>
            <Input
              label="Author"
              required
              value={form.author}
              error={errors.author}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
            />
            <Input
              label="City"
              value={form.city}
              error={errors.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
            <Input
              label="Product mentioned"
              value={form.productName}
              error={errors.productName}
              onChange={(e) =>
                setForm({ ...form, productName: e.target.value })
              }
            />
            <Textarea
              label="Quote"
              required
              value={form.quote}
              error={errors.quote}
              onChange={(e) => setForm({ ...form, quote: e.target.value })}
            />
            <Button type="submit" disabled={saving} className="w-full">
              {saving ? "Saving…" : "Publish"}
            </Button>
          </form>
        </AdminCard>

        <ul className="space-y-3">
          {items.map((t) => (
            <li
              key={t._id}
              className="rounded-lg border border-[var(--admin-line)] bg-[var(--admin-paper)] p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-[var(--admin-ink)]">
                      {t.author}
                    </p>
                    {t.city ? (
                      <span className="text-sm text-[var(--admin-muted)]">
                        · {t.city}
                      </span>
                    ) : null}
                    <AdminStatusBadge status={t.status || "published"} />
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--admin-muted)]">
                    “{t.quote}”
                  </p>
                  {t.productName ? (
                    <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-[var(--admin-faint)]">
                      {t.productName}
                    </p>
                  ) : null}
                </div>
                {canDelete ? (
                  <Button
                    variant="danger"
                    className="!h-10 !min-h-10 shrink-0 !w-auto !px-4"
                    onClick={() => setDeleteId(t._id)}
                  >
                    Delete
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
          {items.length === 0 ? (
            <li className="rounded-lg border border-[var(--admin-line)] bg-[var(--admin-paper)] px-5 py-12 text-center text-sm text-[var(--admin-muted)]">
              No testimonials yet.
            </li>
          ) : null}
        </ul>
      </div>

      <ConfirmDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteId(null);
        }}
        title="Delete this testimonial?"
        description={
          pending
            ? `The quote from ${pending.author} will be permanently removed from the homepage.`
            : "This testimonial will be permanently removed."
        }
        confirmLabel="Delete testimonial"
        cancelLabel="Keep testimonial"
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </AdminShell>
  );
}
