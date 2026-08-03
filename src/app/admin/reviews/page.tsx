"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminPageHeader, AdminStatusBadge } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type R = {
  _id: string;
  productHandle: string;
  author: string;
  city?: string;
  rating: number;
  title?: string;
  body: string;
  status: string;
  verified?: boolean;
};

type AdminUser = {
  email?: string;
  name?: string;
  role?: string;
  isSuperAdmin?: boolean;
};

export default function AdminReviewsPage() {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [items, setItems] = useState<R[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const canDelete = Boolean(
    user?.isSuperAdmin || user?.role === "super_admin",
  );

  function load() {
    fetch("/api/reviews?all=1")
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

  async function setStatus(id: string, status: string) {
    await fetch(`/api/reviews/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await fetch(`/api/reviews/${deleteId}`, { method: "DELETE" });
      setDeleteId(null);
      load();
    } finally {
      setDeleting(false);
    }
  }

  const pending = items.find((r) => r._id === deleteId);

  return (
    <AdminShell user={user}>
      <AdminPageHeader
        title="Product reviews"
        description="Publish or hide reviews on product pages."
      />

      <div className="space-y-3">
        {items.map((r) => (
          <div
            key={r._id}
            className="rounded-lg border border-[var(--admin-line)] bg-[var(--admin-paper)] p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-[var(--admin-ink)]">
                    {r.author}
                    {r.city ? (
                      <span className="font-normal text-[var(--admin-muted)]">
                        {" "}
                        · {r.city}
                      </span>
                    ) : null}
                  </p>
                  <span className="font-mono text-xs tabular-nums text-[var(--admin-muted)]">
                    {r.rating}/5
                  </span>
                  <AdminStatusBadge status={r.status} />
                </div>
                <p className="mt-1 font-mono text-xs text-[var(--admin-faint)]">
                  {r.productHandle}
                  {r.verified ? " · verified" : ""}
                </p>
                {r.title ? (
                  <p className="mt-3 text-sm font-semibold text-[var(--admin-ink)]">
                    {r.title}
                  </p>
                ) : null}
                <p className="mt-1 text-sm leading-relaxed text-[var(--admin-muted)]">
                  {r.body}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {r.status !== "published" ? (
                  <Button
                    className="!h-10 !min-h-10 !w-auto !px-4"
                    onClick={() => setStatus(r._id, "published")}
                  >
                    Publish
                  </Button>
                ) : null}
                {r.status !== "hidden" ? (
                  <Button
                    variant="secondary"
                    className="!h-10 !min-h-10 !w-auto !px-4"
                    onClick={() => setStatus(r._id, "hidden")}
                  >
                    Hide
                  </Button>
                ) : null}
                {canDelete ? (
                  <Button
                    variant="danger"
                    className="!h-10 !min-h-10 !w-auto !px-4"
                    onClick={() => setDeleteId(r._id)}
                  >
                    Delete
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 ? (
          <p className="rounded-lg border border-[var(--admin-line)] bg-[var(--admin-paper)] px-5 py-12 text-center text-sm text-[var(--admin-muted)]">
            No reviews yet.
          </p>
        ) : null}
      </div>

      <ConfirmDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteId(null);
        }}
        title="Delete this review?"
        description={
          pending
            ? `Review from ${pending.author} on ${pending.productHandle} will be permanently removed.`
            : "This review will be permanently removed."
        }
        confirmLabel="Delete review"
        cancelLabel="Keep review"
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </AdminShell>
  );
}
