"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  AdminCard,
  AdminNotice,
  AdminPageHeader,
  AdminStatusBadge,
  AdminTable,
  AdminTd,
  AdminTh,
  readAdminJson,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/cn";

type Template = {
  index: number;
  id: string;
  label: string;
  audience: "Customer" | "Store team";
  trigger: string;
};

type LogRow = {
  id: string;
  template: string;
  to: string;
  subject: string;
  status: "sent" | "failed" | "skipped";
  error: string;
  ref: string;
  createdAt: string;
};

type Overview = {
  configured: boolean;
  from: string;
  replyTo: string;
  adminRecipients: string[];
  host: string;
  templates: Template[];
  logs: LogRow[];
  subscribers: {
    subscribed: number;
    unsubscribed: number;
    recent: { email: string; status: string; source: string; createdAt: string }[];
  };
};

type Preview = { subject: string; html: string; text: string };

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Karachi",
  });
}

const LOG_FILTERS = [
  { value: "all", label: "All emails" },
  { value: "sent", label: "Sent" },
  { value: "failed", label: "Failed" },
  { value: "skipped", label: "Skipped (not configured)" },
] as const;

export default function AdminEmailsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email?: string; name?: string; isSuperAdmin?: boolean } | null>(null);
  const [data, setData] = useState<Overview | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(0);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [view, setView] = useState<"html" | "text">("html");
  const [testTo, setTestTo] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<{ tone: "info" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/auth")
      .then((r) => r.json())
      .then((j) => {
        if (!j.ok) router.replace("/admin/login");
        else setUser(j.data);
      })
      .catch(() => router.replace("/admin/login"));
  }, [router]);

  const load = useCallback(async () => {
    setLoadError(null);
    const params = filter === "all" ? "" : `?status=${filter}`;
    const res = await readAdminJson<Overview>(await fetch(`/api/admin/emails${params}`));
    if (!res.ok || !res.data) {
      setLoadError(res.error || "Could not load emails");
      return;
    }
    setData(res.data);
    setTestTo((prev) => prev || res.data!.adminRecipients[0] || "");
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/emails/preview?i=${selected}`)
      .then((r) => readAdminJson<Preview>(r))
      .then((res) => {
        if (!cancelled && res.ok && res.data) setPreview(res.data);
      });
    return () => {
      cancelled = true;
    };
  }, [selected]);

  async function sendTest(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setNotice(null);
    try {
      const res = await readAdminJson(
        await fetch("/api/admin/emails/test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ index: selected, to: testTo }),
        }),
      );
      setNotice(
        res.ok
          ? { tone: "info", text: `Test sent to ${testTo}. Check the inbox and spam folder.` }
          : { tone: "error", text: res.error || "Test failed" },
      );
      void load();
    } catch {
      setNotice({ tone: "error", text: "Network error" });
    } finally {
      setSending(false);
    }
  }

  const current = data?.templates[selected];

  return (
    <AdminShell user={user}>
      <AdminPageHeader
        title="Emails"
        description="Order, account and contact emails the store sends automatically. Preview every template, send yourself a test, and check what was delivered."
      />

      {loadError ? <AdminNotice tone="error">{loadError}</AdminNotice> : null}

      {data ? (
        <AdminCard title="Delivery settings" className="mb-6">
          <div className="grid gap-4 px-4 py-4 text-sm sm:grid-cols-2 sm:px-5 lg:grid-cols-4">
            <div>
              <p className="text-admin-muted">Status</p>
              <p className={cn("mt-1 font-medium", data.configured ? "text-admin-ink" : "text-rosewood")}>
                {data.configured ? "Connected" : "Not configured"}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-admin-muted">Sends from</p>
              <p className="mt-1 break-words font-medium text-admin-ink">{data.from || "Not set"}</p>
            </div>
            <div className="min-w-0">
              <p className="text-admin-muted">Customer replies go to</p>
              <p className="mt-1 break-words font-medium text-admin-ink">{data.replyTo || "Not set"}</p>
            </div>
            <div className="min-w-0">
              <p className="text-admin-muted">Store alerts go to</p>
              <p className="mt-1 break-words font-medium text-admin-ink">
                {data.adminRecipients.join(", ") || "Not set"}
              </p>
            </div>
          </div>
          {!data.configured ? (
            <p className="border-t border-admin-line px-4 py-3 text-sm leading-relaxed text-admin-muted sm:px-5">
              Add <code className="font-mono">SMTP_USER</code> (the Gmail address the app password belongs to) and{" "}
              <code className="font-mono">APP_PASSWORD</code> to the environment, then redeploy. Until then emails are
              recorded below as skipped and orders still go through.
            </p>
          ) : null}
        </AdminCard>
      ) : null}

      {data ? (
        <AdminCard title="Templates" className="mb-6">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,20rem)_1fr]">
            <ul className="max-h-[44rem] overflow-y-auto border-b border-admin-line lg:border-b-0 lg:border-r">
              {data.templates.map((t) => (
                <li key={t.index}>
                  <button
                    type="button"
                    onClick={() => setSelected(t.index)}
                    className={cn(
                      "w-full cursor-pointer border-b border-admin-line px-4 py-3 text-left transition-colors sm:px-5",
                      selected === t.index ? "bg-admin-soft" : "hover:bg-admin-soft/60",
                    )}
                  >
                    <span className="block text-sm font-medium text-admin-ink">{t.label}</span>
                    <span className="mt-0.5 block text-xs text-admin-muted">
                      {t.audience} · {t.trigger}
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <div className="min-w-0 p-4 sm:p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wider text-admin-muted">Subject</p>
                  <p className="truncate text-sm font-medium text-admin-ink">{preview?.subject || "Loading…"}</p>
                </div>
                <div className="flex gap-1 rounded-md border border-admin-line p-0.5 text-xs">
                  {(["html", "text"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setView(v)}
                      className={cn(
                        "cursor-pointer rounded px-3 py-1.5",
                        view === v ? "bg-admin-ink text-admin-paper" : "text-admin-muted hover:text-admin-ink",
                      )}
                    >
                      {v === "html" ? "Email" : "Plain text"}
                    </button>
                  ))}
                </div>
              </div>

              {preview ? (
                view === "html" ? (
                  <iframe
                    title={`Preview: ${current?.label || "email"}`}
                    srcDoc={preview.html}
                    sandbox=""
                    className="h-[38rem] w-full rounded-md border border-admin-line bg-white"
                  />
                ) : (
                  <pre className="h-[38rem] overflow-auto whitespace-pre-wrap rounded-md border border-admin-line bg-admin-soft p-4 font-mono text-xs leading-relaxed text-admin-ink">
                    {preview.text}
                  </pre>
                )
              ) : (
                <div className="h-[38rem] rounded-md border border-admin-line bg-admin-soft" />
              )}

              {user?.isSuperAdmin ? (
                <form onSubmit={sendTest} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="min-w-0 flex-1">
                    <Input
                      label="Send a test of this template to"
                      type="email"
                      value={testTo}
                      onChange={(e) => setTestTo(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={sending || !testTo}>
                    {sending ? "Sending…" : "Send test"}
                  </Button>
                </form>
              ) : null}
              {notice ? (
                <AdminNotice tone={notice.tone} onDismiss={() => setNotice(null)} className="mt-3">
                  {notice.text}
                </AdminNotice>
              ) : null}
            </div>
          </div>
        </AdminCard>
      ) : null}

      {data ? (
        <AdminCard
          title="Delivery log"
          className="mb-6"
          action={
            <div className="w-full sm:w-56">
              <Select
                value={filter}
                onValueChange={setFilter}
                options={LOG_FILTERS}
                aria-label="Filter delivery log"
              />
            </div>
          }
        >
          {data.logs.length ? (
            <AdminTable>
              <thead>
                <tr>
                  <AdminTh>When</AdminTh>
                  <AdminTh>Template</AdminTh>
                  <AdminTh>To</AdminTh>
                  <AdminTh>Status</AdminTh>
                  <AdminTh>Reference</AdminTh>
                </tr>
              </thead>
              <tbody>
                {data.logs.map((l) => (
                  <tr key={l.id}>
                    <AdminTd className="whitespace-nowrap">{formatDate(l.createdAt)}</AdminTd>
                    <AdminTd>
                      <span className="block font-medium">{l.template}</span>
                      <span className="block max-w-xs truncate text-xs text-admin-muted" title={l.subject}>
                        {l.subject}
                      </span>
                    </AdminTd>
                    <AdminTd className="break-all">{l.to}</AdminTd>
                    <AdminTd>
                      <AdminStatusBadge status={l.status === "sent" ? "delivered" : l.status} />
                      {l.error ? (
                        <span className="mt-1 block max-w-xs text-xs text-rosewood" title={l.error}>
                          {l.error.slice(0, 80)}
                        </span>
                      ) : null}
                    </AdminTd>
                    <AdminTd className="font-mono text-xs">{l.ref || ""}</AdminTd>
                  </tr>
                ))}
              </tbody>
            </AdminTable>
          ) : (
            <p className="px-4 py-6 text-sm text-admin-muted sm:px-5">No emails recorded yet.</p>
          )}
        </AdminCard>
      ) : null}

      {data ? (
        <AdminCard title="Newsletter subscribers">
          <div className="flex flex-wrap gap-8 border-b border-admin-line px-4 py-4 text-sm sm:px-5">
            <div>
              <p className="text-admin-muted">Subscribed</p>
              <p className="mt-1 font-display text-2xl text-admin-ink">{data.subscribers.subscribed}</p>
            </div>
            <div>
              <p className="text-admin-muted">Unsubscribed</p>
              <p className="mt-1 font-display text-2xl text-admin-ink">{data.subscribers.unsubscribed}</p>
            </div>
          </div>
          {data.subscribers.recent.length ? (
            <AdminTable>
              <thead>
                <tr>
                  <AdminTh>Email</AdminTh>
                  <AdminTh>Status</AdminTh>
                  <AdminTh>Source</AdminTh>
                  <AdminTh>Joined</AdminTh>
                </tr>
              </thead>
              <tbody>
                {data.subscribers.recent.map((s) => (
                  <tr key={s.email}>
                    <AdminTd className="break-all">{s.email}</AdminTd>
                    <AdminTd>
                      <AdminStatusBadge status={s.status === "subscribed" ? "active" : "archived"} />
                    </AdminTd>
                    <AdminTd>{s.source}</AdminTd>
                    <AdminTd className="whitespace-nowrap">{formatDate(s.createdAt)}</AdminTd>
                  </tr>
                ))}
              </tbody>
            </AdminTable>
          ) : (
            <p className="px-4 py-6 text-sm text-admin-muted sm:px-5">No subscribers yet.</p>
          )}
        </AdminCard>
      ) : null}
    </AdminShell>
  );
}
