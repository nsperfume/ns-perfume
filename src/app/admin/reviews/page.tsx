"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format, isValid, parseISO } from "date-fns";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  AdminEmptyState,
  AdminFilterChips,
  AdminNotice,
  AdminPageHeader,
  AdminSearchInput,
  AdminStatusBadge,
  readAdminJson,
} from "@/components/admin/ui";
import { Button } from "@/components/admin/button";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { toast } from "@/components/admin/toast";

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
  createdAt?: string;
};

type AdminUser = {
  email?: string;
  name?: string;
  role?: string;
  isSuperAdmin?: boolean;
};

function Stars({ rating }: { rating: number }) {
  const r = Math.max(0, Math.min(5, Math.round(rating || 0)));
  return (
    <span
      className="inline-flex items-center gap-0.5 text-brass"
      role="img"
      aria-label={`${r} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          className="h-4 w-4"
          fill={i < r ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.4"
          aria-hidden
        >
          <path d="M10 2.5l2.3 4.7 5.2.8-3.8 3.7.9 5.2L10 14.4l-4.6 2.5.9-5.2-3.8-3.7 5.2-.8z" />
        </svg>
      ))}
    </span>
  );
}

function formatDay(iso?: string) {
  if (!iso) return "";
  const d = parseISO(iso);
  return isValid(d) ? format(d, "d MMM yyyy") : "";
}

export default function AdminReviewsPage() {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [items, setItems] = useState<R[]>([]);
  const [productNames, setProductNames] = useState<Map<string, string>>(
    () => new Map(),
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [filter, setFilter] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<R | null>(null);
  const [deleting, setDeleting] = useState(false);

  const canDelete = Boolean(
    user?.isSuperAdmin || user?.role === "super_admin",
  );

  function load() {
    setLoading(true);
    fetch("/api/reviews?all=1")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) {
          setItems(j.data);
          setLoadError("");
          // Open on the moderation queue when there is one.
          setFilter(
            (prev) =>
              prev ??
              ((j.data as R[]).some((r) => r.status === "pending")
                ? "pending"
                : "all"),
          );
        } else setLoadError(j.error || "Could not load reviews");
      })
      .catch(() => setLoadError("Network error while loading reviews"))
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
        setProductNames(
          new Map(
            (j.data as { handle: string; name: string }[]).map((p) => [
              p.handle,
              p.name,
            ]),
          ),
        );
      })
      .catch(() => {
        /* fall back to handles */
      });
  }, [router]);

  const productName = (handle: string) => productNames.get(handle) || handle;

  const counts = useMemo(
    () => ({
      all: items.length,
      pending: items.filter((r) => r.status === "pending").length,
      published: items.filter((r) => r.status === "published").length,
      hidden: items.filter((r) => r.status === "hidden").length,
    }),
    [items],
  );

  const activeFilter = filter ?? "all";

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((r) => {
      if (activeFilter !== "all" && r.status !== activeFilter) return false;
      if (!q) return true;
      return [
        r.author,
        r.city,
        r.title,
        r.body,
        productNames.get(r.productHandle) || r.productHandle,
      ]
        .filter(Boolean)
        .some((s) => String(s).toLowerCase().includes(q));
    });
  }, [items, query, activeFilter, productNames]);

  async function setStatus(r: R, status: "published" | "hidden") {
    setBusyId(r._id);
    try {
      const res = await fetch(`/api/reviews/${r._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await readAdminJson(res);
      if (!json.ok) {
        toast.error(
          json.error ||
            `Could not ${status === "published" ? "publish" : "hide"} the review`,
        );
        return;
      }
      toast.success(
        status === "published"
          ? `Review from ${r.author} published`
          : `Review from ${r.author} hidden`,
      );
      setItems((list) =>
        list.map((x) => (x._id === r._id ? { ...x, status } : x)),
      );
    } catch {
      toast.error("Network error. The review was not changed.");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/reviews/${deleteTarget._id}`, {
        method: "DELETE",
      });
      const json = await readAdminJson(res);
      if (!json.ok) {
        toast.error(json.error || "Could not delete the review");
        return;
      }
      toast.success("Review deleted");
      setItems((list) => list.filter((x) => x._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch {
      toast.error("Network error. The review was not deleted.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AdminShell user={user}>
      <AdminPageHeader title="Reviews" />

      {loadError ? (
        <AdminNotice tone="error" onDismiss={() => setLoadError("")}>
          {loadError}
        </AdminNotice>
      ) : null}

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <AdminFilterChips
          label="Filter reviews"
          value={activeFilter}
          onChange={setFilter}
          options={[
            { value: "pending", label: "To review", count: counts.pending },
            { value: "published", label: "Published", count: counts.published },
            { value: "hidden", label: "Hidden", count: counts.hidden },
            { value: "all", label: "All", count: counts.all },
          ]}
        />
        <AdminSearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search reviews"
          className="w-full md:w-72"
        />
      </div>

      {visible.length ? (
        <ul className="space-y-3">
          {visible.map((r) => {
            const busy = busyId === r._id;
            return (
              <li
                key={r._id}
                className="rounded-lg border border-admin-line bg-admin-paper p-5 shadow-admin"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
                  <div className="min-w-0 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      <Stars rating={r.rating} />
                      <AdminStatusBadge status={r.status} />
                      {r.verified ? (
                        <AdminStatusBadge status="sent" tone="neutral" label="Verified buyer" />
                      ) : null}
                    </div>
                    {r.title ? (
                      <p className="mt-3 text-base font-semibold text-admin-ink">
                        {r.title}
                      </p>
                    ) : null}
                    <p className="mt-1.5 whitespace-pre-line text-[0.9375rem] leading-relaxed text-admin-ink">
                      {r.body}
                    </p>
                    <p className="mt-3 text-[0.8125rem] text-admin-muted">
                      <span className="font-semibold text-admin-ink">
                        {r.author}
                      </span>
                      {r.city ? `, ${r.city}` : ""}
                      {" on "}
                      <a
                        href={`/products/${encodeURIComponent(r.productHandle)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-admin-accent hover:underline"
                      >
                        {productName(r.productHandle)}
                      </a>
                      {r.createdAt ? ` · ${formatDay(r.createdAt)}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {r.status !== "published" ? (
                      <Button
                        size="sm"
                        className="w-auto!"
                        disabled={busy}
                        onClick={() => setStatus(r, "published")}
                      >
                        Publish
                      </Button>
                    ) : null}
                    {r.status !== "hidden" ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-auto!"
                        disabled={busy}
                        onClick={() => setStatus(r, "hidden")}
                      >
                        Hide
                      </Button>
                    ) : null}
                    {canDelete ? (
                      <Button
                        variant="danger-outline"
                        size="sm"
                        className="w-auto!"
                        disabled={busy}
                        onClick={() => setDeleteTarget(r)}
                      >
                        Delete
                      </Button>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="rounded-lg border border-admin-line bg-admin-paper shadow-admin">
          {loading ? (
            <p className="px-6 py-14 text-center text-admin-muted">
              Loading reviews…
            </p>
          ) : !items.length ? (
            <AdminEmptyState
              title="No reviews yet"
              description="Customer reviews from product pages land here for approval."
            />
          ) : activeFilter === "pending" && !query ? (
            <AdminEmptyState
              title="All caught up"
              description="No reviews are waiting for approval."
              action={
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="w-auto!"
                  onClick={() => setFilter("all")}
                >
                  Show all reviews
                </Button>
              }
            />
          ) : (
            <AdminEmptyState
              title="No reviews match"
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
          )}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTarget(null);
        }}
        title="Delete this review?"
        description={
          deleteTarget
            ? `The review from ${deleteTarget.author} on ${productName(deleteTarget.productHandle)} will be removed for good.`
            : "This review will be removed for good."
        }
        confirmLabel="Delete review"
        cancelLabel="Keep review"
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </AdminShell>
  );
}
