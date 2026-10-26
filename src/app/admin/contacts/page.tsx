"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { BrandLoaderBlock } from "@/components/brand/brand-loader";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  AdminCard,
  AdminContactActions,
  AdminEmptyState,
  AdminFilterChips,
  AdminIcon,
  AdminIconAction,
  AdminModal,
  AdminPageHeader,
  AdminRowActions,
  AdminSearchInput,
  AdminStatusBadge,
  readAdminJson,
} from "@/components/admin/ui";
import { Button } from "@/components/admin/button";
import { toast } from "@/components/admin/toast";
import { cn } from "@/lib/cn";
import { contactTopicLabel } from "@/lib/contact-topics";

type Msg = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  topic: string;
  orderNumber?: string;
  message: string;
  status: string;
  createdAt?: string;
};

function formatDate(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function preview(text: string, max = 90) {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

const STATUS_CHIPS = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "read", label: "Read" },
  { value: "closed", label: "Closed" },
] as const;

function ContactsInbox() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFilter = searchParams.get("email") || "";
  const initialStatus = searchParams.get("status") || "all";
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(
    null,
  );
  const [rows, setRows] = useState<Msg[]>([]);
  const [status, setStatus] = useState(
    STATUS_CHIPS.some((c) => c.value === initialStatus) ? initialStatus : "all",
  );
  const [q, setQ] = useState("");
  const [detail, setDetail] = useState<Msg | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    fetch("/api/admin/contacts")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setRows(j.data);
        else setLoadError(j.error || "Could not load messages");
      })
      .catch(() => setLoadError("Could not load messages. Check your connection."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/admin/auth")
      .then((r) => r.json())
      .then((j) => {
        if (!j.ok) router.replace("/admin/login");
        else setUser(j.data);
      });
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const scoped = useMemo(() => {
    if (!emailFilter) return rows;
    const e = emailFilter.toLowerCase();
    return rows.filter((r) => r.email.toLowerCase() === e);
  }, [rows, emailFilter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: scoped.length };
    for (const r of scoped) c[r.status] = (c[r.status] || 0) + 1;
    return c;
  }, [scoped]);

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    return scoped.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (!term) return true;
      return [r.name, r.email, contactTopicLabel(r.topic), r.phone, r.orderNumber, r.message].some((v) =>
        (v || "").toLowerCase().includes(term),
      );
    });
  }, [scoped, status, q]);

  async function setMessageStatus(id: string, next: string, quiet = false) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/contacts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const json = await readAdminJson(res);
      if (!json.ok) {
        toast.error(json.error || "Could not update the message");
        return;
      }
      if (!quiet) {
        toast.success(
          next === "closed"
            ? "Conversation closed"
            : next === "new"
              ? "Marked as new"
              : "Marked as read",
        );
      }
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: next } : r)));
      setDetail((d) => (d && d.id === id ? { ...d, status: next } : d));
    } catch {
      toast.error("Network error. The message was not updated.");
    } finally {
      setSaving(false);
    }
  }

  function openMessage(m: Msg) {
    setDetail(m);
    if (m.status === "new") void setMessageStatus(m.id, "read", true);
  }

  const filtered = status !== "all" || q.trim() !== "";
  const empty = !loading && visible.length === 0;
  const emptyState = loadError ? (
    <AdminEmptyState
      title="Messages could not load"
      description={loadError}
      action={
        <Button variant="secondary" onClick={load}>
          Try again
        </Button>
      }
    />
  ) : filtered ? (
    <AdminEmptyState
      title="No messages match"
      action={
        <Button
          variant="secondary"
          onClick={() => {
            setStatus("all");
            setQ("");
          }}
        >
          Clear filters
        </Button>
      }
    />
  ) : (
    <AdminEmptyState
      title="No messages yet"
      description="Messages sent from the contact page will arrive here."
    />
  );

  return (
    <AdminShell user={user}>
      <AdminPageHeader title="Messages" />

      {emailFilter ? (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-md border border-admin-line bg-admin-paper px-4 py-2.5 text-[0.9375rem]">
          <span className="text-admin-muted">
            Showing messages from{" "}
            <span className="font-semibold text-admin-ink">{emailFilter}</span>
          </span>
          <Link
            href="/admin/contacts"
            className="ml-auto text-sm font-semibold text-admin-accent hover:underline"
          >
            Show all
          </Link>
        </div>
      ) : null}

      <div
        className={cn(
          "mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between",
          !loading && !scoped.length && "hidden",
        )}
      >
        <AdminFilterChips
          label="Message status"
          value={status}
          onChange={setStatus}
          options={STATUS_CHIPS.map((c) => ({
            value: c.value,
            label: c.label,
            count: counts[c.value] || 0,
          }))}
        />
        <AdminSearchInput
          value={q}
          onChange={setQ}
          placeholder="Search name, email or message"
          label="Search messages"
          className="w-full lg:max-w-sm"
        />
      </div>

      <AdminCard>
        {loading && !rows.length ? (
          <BrandLoaderBlock className="min-h-[40vh]" label="Loading messages" />
        ) : empty ? (
          emptyState
        ) : (
          <ul className="divide-y divide-admin-line">
            {visible.map((m) => (
                <li
                  key={m.id}
                  className={cn(
                    "flex flex-col transition-colors hover:bg-admin-soft-2 md:flex-row md:items-center",
                    m.status === "new" && "bg-admin-soft-2",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => openMessage(m)}
                    className="grid min-w-0 flex-1 cursor-pointer grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 px-5 pb-2 pt-4 text-left sm:px-6 md:grid-cols-[14rem_minmax(0,1fr)_auto] md:items-center md:py-4 md:pr-2"
                  >
                    <span className="min-w-0">
                      <span
                        className={cn(
                          "block truncate text-[0.9375rem] text-admin-ink",
                          m.status === "new" ? "font-bold" : "font-semibold",
                        )}
                      >
                        {m.name}
                      </span>
                      <span className="block truncate text-[0.8125rem] text-admin-muted">
                        {m.email}
                      </span>
                    </span>
                    <span className="col-span-2 row-start-2 min-w-0 md:col-span-1 md:row-start-1 md:col-start-2">
                      <span className="block truncate text-sm font-semibold text-admin-ink">
                        {contactTopicLabel(m.topic)}
                        {m.orderNumber ? (
                          <span className="font-normal text-admin-muted"> · {m.orderNumber}</span>
                        ) : null}
                      </span>
                      <span className="block truncate text-[0.9375rem] text-admin-muted">
                        {preview(m.message)}
                      </span>
                    </span>
                    <span className="flex flex-col items-end gap-1.5 md:col-start-3 md:row-start-1">
                      <AdminStatusBadge status={m.status} />
                      <span className="whitespace-nowrap text-[0.8125rem] text-admin-muted">
                        {formatDate(m.createdAt)}
                      </span>
                    </span>
                  </button>
                  <AdminRowActions className="px-3 pb-2 md:pb-0 md:pr-4">
                    <AdminIconAction
                      icon="view"
                      label="Open message"
                      ariaLabel={`Open message from ${m.name}`}
                      onClick={() => openMessage(m)}
                    />
                    <AdminIconAction
                      icon="reply"
                      label="Reply by email"
                      ariaLabel={`Reply to ${m.name} by email`}
                      href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${contactTopicLabel(m.topic)}`)}`}
                    />
                  </AdminRowActions>
                </li>
            ))}
          </ul>
        )}
      </AdminCard>

      <AdminModal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail ? contactTopicLabel(detail.topic) : "Message"}
        wide
      >
        {detail ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-base font-semibold text-admin-ink">{detail.name}</p>
                <a
                  href={`mailto:${detail.email}`}
                  className="break-all text-[0.9375rem] text-admin-accent hover:underline"
                >
                  {detail.email}
                </a>
                <p className="mt-1 text-[0.8125rem] text-admin-muted">
                  {formatDate(detail.createdAt)}
                </p>
              </div>
              <AdminStatusBadge status={detail.status} />
            </div>
            {detail.phone || detail.orderNumber ? (
              <dl className="grid gap-3 rounded-md border border-admin-line p-4 text-[0.9375rem] sm:grid-cols-2">
                {detail.phone ? (
                  <div>
                    <dt className="text-[0.8125rem] text-admin-muted">Phone</dt>
                    <dd className="font-semibold text-admin-ink">{detail.phone}</dd>
                  </div>
                ) : null}
                {detail.orderNumber ? (
                  <div>
                    <dt className="text-[0.8125rem] text-admin-muted">Order number</dt>
                    <dd>
                      <Link
                        href={`/admin/orders/${encodeURIComponent(detail.orderNumber)}`}
                        className="font-semibold text-admin-accent hover:underline"
                      >
                        {detail.orderNumber}
                      </Link>
                    </dd>
                  </div>
                ) : null}
              </dl>
            ) : null}
            <AdminContactActions
              phone={detail.phone}
              whatsappText={`Hi ${detail.name.split(" ")[0]}, this is NS Perfume about your message.`}
            />
            <p className="whitespace-pre-wrap rounded-md border border-admin-line bg-admin-soft-2 p-4 text-[0.9375rem] leading-relaxed text-admin-ink">
              {detail.message}
            </p>
            <div className="flex flex-col-reverse gap-2 border-t border-admin-line pt-4 sm:flex-row sm:items-center">
              <Link
                href={`/admin/customers/${encodeURIComponent(detail.email)}`}
                className="text-sm font-semibold text-admin-accent hover:underline sm:mr-auto"
              >
                View customer
              </Link>
              {detail.status === "closed" ? (
                <Button
                  variant="secondary"
                  disabled={saving}
                  onClick={() => setMessageStatus(detail.id, "new")}
                >
                  Reopen
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  disabled={saving}
                  onClick={() => setMessageStatus(detail.id, "closed")}
                >
                  Close conversation
                </Button>
              )}
              <a
                href={`mailto:${detail.email}?subject=${encodeURIComponent(`Re: ${contactTopicLabel(detail.topic)}`)}`}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-admin-ink bg-admin-ink px-5 text-sm font-semibold text-admin-paper transition-colors hover:border-brass hover:bg-brass hover:text-white"
              >
                <AdminIcon name="reply" size={17} />
                Reply by email
              </a>
            </div>
          </div>
        ) : null}
      </AdminModal>
    </AdminShell>
  );
}

export default function AdminContactsPage() {
  return (
    <Suspense
      fallback={
        <BrandLoaderBlock className="min-h-[40vh]" label="Loading messages" />
      }
    >
      <ContactsInbox />
    </Suspense>
  );
}
