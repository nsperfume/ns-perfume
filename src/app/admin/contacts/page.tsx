"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  AdminModal,
  AdminPageHeader,
  AdminStatusBadge,
  AdminTable,
  AdminTd,
  AdminTh,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/cn";

type Msg = {
  id: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  status: string;
  createdAt?: string;
};

function formatDate(iso?: string) {
  if (!iso) return "—";
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

function ContactsInbox() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFilter = searchParams.get("email") || "";
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(
    null,
  );
  const [rows, setRows] = useState<Msg[]>([]);
  const [status, setStatus] = useState("all");
  const [detail, setDetail] = useState<Msg | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    fetch(`/api/admin/contacts?${params}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setRows(j.data);
      })
      .finally(() => setLoading(false));
  }, [status]);

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

  const visible = useMemo(() => {
    if (!emailFilter) return rows;
    const e = emailFilter.toLowerCase();
    return rows.filter((r) => r.email.toLowerCase() === e);
  }, [rows, emailFilter]);

  async function setMessageStatus(id: string, next: string) {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/contacts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const json = await res.json();
      if (!json.ok) {
        setMsg(json.error || "Update failed");
      } else {
        setMsg(`Marked as ${next}`);
        setDetail((d) => (d && d.id === id ? { ...d, status: next } : d));
        load();
      }
    } catch {
      setMsg("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function openMessage(m: Msg) {
    setDetail(m);
    if (m.status === "new") {
      await setMessageStatus(m.id, "read");
    }
  }

  return (
    <AdminShell user={user}>
      <AdminPageHeader
        title="Contacts"
        description="Messages from the storefront contact form."
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full sm:w-52">
          <Select
            label="Status"
            value={status}
            onValueChange={setStatus}
            options={[
              { value: "all", label: "All" },
              { value: "new", label: "New" },
              { value: "read", label: "Read" },
              { value: "closed", label: "Closed" },
            ]}
            triggerClassName="border-admin-input-border! bg-admin-soft-2! text-admin-ink!"
          />
        </div>
        {emailFilter ? (
          <p className="text-sm text-admin-muted">
            Filtered to{" "}
            <span className="font-medium text-admin-ink">
              {emailFilter}
            </span>
            .{" "}
            <Link href="/admin/contacts" className="text-brass hover:underline">
              Clear
            </Link>
          </p>
        ) : null}
      </div>

      {msg ? (
        <p className="mb-4 border border-admin-line bg-admin-paper px-4 py-2.5 text-sm text-admin-ink">
          {msg}
        </p>
      ) : null}

      <AdminTable>
        <thead>
          <tr>
            <AdminTh>From</AdminTh>
            <AdminTh>Topic</AdminTh>
            <AdminTh>Preview</AdminTh>
            <AdminTh>Status</AdminTh>
            <AdminTh>Date</AdminTh>
            <AdminTh className="text-right">Actions</AdminTh>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan={6}
                className="px-4 py-14 text-center text-admin-muted"
              >
                Loading…
              </td>
            </tr>
          ) : visible.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="px-4 py-14 text-center text-admin-muted"
              >
                No messages{status !== "all" ? ` with status “${status}”` : ""}.
              </td>
            </tr>
          ) : (
            visible.map((m) => (
              <tr
                key={m.id}
                className={cn(
                  "hover:bg-admin-soft",
                  m.status === "new" && "bg-admin-soft/60",
                )}
              >
                <AdminTd>
                  <p className="font-medium">{m.name}</p>
                  <p className="text-[11px] text-admin-muted">
                    {m.email}
                  </p>
                </AdminTd>
                <AdminTd className="text-xs font-semibold uppercase tracking-wide text-admin-muted">
                  {m.topic}
                </AdminTd>
                <AdminTd className="max-w-[18rem] text-[13px] text-admin-ink">
                  {preview(m.message)}
                </AdminTd>
                <AdminTd>
                  <AdminStatusBadge status={m.status} />
                </AdminTd>
                <AdminTd className="whitespace-nowrap text-[13px] text-admin-muted">
                  {formatDate(m.createdAt)}
                </AdminTd>
                <AdminTd className="text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      variant="secondary"
                      className="h-10! min-h-10! w-auto! px-4!"
                      onClick={() => openMessage(m)}
                    >
                      Open
                    </Button>
                    <Button
                      href={`/admin/customers/${encodeURIComponent(m.email)}`}
                      variant="ghost"
                      className="min-h-10!"
                    >
                      Profile
                    </Button>
                  </div>
                </AdminTd>
              </tr>
            ))
          )}
        </tbody>
      </AdminTable>

      <AdminModal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail ? `Message from ${detail.name}` : "Message"}
        wide
      >
        {detail ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <AdminStatusBadge status={detail.status} />
              <span className="text-xs font-semibold uppercase tracking-wide text-admin-muted">
                {detail.topic}
              </span>
              <span className="text-sm text-admin-faint">
                {formatDate(detail.createdAt)}
              </span>
            </div>
            <div>
              <p className="text-sm text-admin-muted">{detail.email}</p>
              <Link
                href={`/admin/customers/${encodeURIComponent(detail.email)}`}
                className="mt-1 inline-block text-sm font-medium text-brass hover:underline"
              >
                Open customer profile
              </Link>
            </div>
            <p className="whitespace-pre-wrap rounded-md border border-admin-line bg-admin-soft-2 p-4 font-serif text-[1.05rem] leading-relaxed text-admin-ink">
              {detail.message}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                disabled={saving || detail.status === "read"}
                className="w-auto!"
                onClick={() => setMessageStatus(detail.id, "read")}
              >
                Mark read
              </Button>
              <Button
                disabled={saving || detail.status === "closed"}
                className="w-auto!"
                onClick={() => setMessageStatus(detail.id, "closed")}
              >
                Close
              </Button>
              <Button
                variant="ghost"
                disabled={saving || detail.status === "new"}
                onClick={() => setMessageStatus(detail.id, "new")}
              >
                Reopen as new
              </Button>
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
        <div className="p-8 text-base text-admin-muted">
          Loading contacts…
        </div>
      }
    >
      <ContactsInbox />
    </Suspense>
  );
}
