"use client";

import Link from "next/link";
import { BrandLoader, BrandLoaderBlock } from "@/components/brand/brand-loader";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  AdminCard,
  AdminEmptyState,
  AdminFilterChips,
  AdminIcon,
  AdminIconAction,
  AdminModal,
  AdminPageHeader,
  AdminRowActions,
  AdminStatusBadge,
  AdminTable,
  AdminTd,
  AdminTh,
  readAdminJson,
} from "@/components/admin/ui";
import { Button } from "@/components/admin/button";
import { Input } from "@/components/admin/input";
import { AdminFieldLabel } from "@/components/admin/form-section";
import {
  AdminFieldError,
  useFormValidation,
} from "@/components/admin/form-validation";
import { toast } from "@/components/admin/toast";
import { formatOrderNumber } from "@/lib/order-number";
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

function sentence(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/[-_]/g, " ") : "";
}

const LOG_FILTERS = [
  { value: "all", label: "All" },
  { value: "sent", label: "Sent" },
  { value: "failed", label: "Failed" },
  { value: "skipped", label: "Not sent" },
] as const;

const NOT_SET_UP = "Email sending is not set up yet. Contact your developer.";

/* Mirrors POST /api/admin/emails/test */
const testSchema = z.object({
  to: z
    .string()
    .trim()
    .min(1, "Enter an email address")
    .email("Enter a valid email")
    .max(200, "Use 200 characters or fewer"),
});

function friendlySendError(message?: string) {
  if (!message) return "The test email could not be sent";
  if (/not configured|SMTP|APP_PASSWORD/i.test(message)) return NOT_SET_UP;
  if (/^Send failed/i.test(message))
    return "The test email could not be sent. Try again later.";
  return message;
}

function LoadingCards() {
  return <BrandLoaderBlock className="min-h-[40vh]" label="Loading emails" />;
}

export default function AdminEmailsPage() {
  const router = useRouter();
  const testFormRef = useRef<HTMLFormElement>(null);
  const [user, setUser] = useState<{
    email?: string;
    name?: string;
    isSuperAdmin?: boolean;
  } | null>(null);
  const [data, setData] = useState<Overview | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [logLoading, setLogLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(0);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [testTo, setTestTo] = useState("");
  const [sending, setSending] = useState(false);
  const [logDetail, setLogDetail] = useState<LogRow | null>(null);
  const tv = useFormValidation(testSchema);

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
    setLogLoading(true);
    try {
      const params = filter === "all" ? "" : `?status=${filter}`;
      const res = await readAdminJson<Overview>(
        await fetch(`/api/admin/emails${params}`),
      );
      if (!res.ok || !res.data) {
        setLoadError(res.error || "Could not load emails");
        return;
      }
      setData(res.data);
      setTestTo((prev) => prev || res.data!.adminRecipients[0] || "");
    } catch {
      setLoadError("Network error while loading emails");
    } finally {
      setLogLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    setPreview(null);
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
    if (!tv.validate({ to: testTo }, testFormRef.current)) return;
    setSending(true);
    try {
      const res = await readAdminJson(
        await fetch("/api/admin/emails/test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ index: selected, to: testTo.trim() }),
        }),
      );
      if (res.ok) {
        toast.success(`Test sent to ${testTo.trim()}`, {
          description: "Check the inbox and the spam folder.",
        });
      } else {
        toast.error(friendlySendError(res.error));
      }
      void load();
    } catch {
      toast.error("Network error. The test was not sent.");
    } finally {
      setSending(false);
    }
  }

  const current = data?.templates[selected];

  return (
    <AdminShell user={user}>
      <AdminPageHeader title="Emails" />

      {!data && !loadError ? <LoadingCards /> : null}

      {!data && loadError ? (
        <AdminCard>
          <AdminEmptyState
            title="Emails could not be loaded"
            description={loadError}
            action={
              <Button
                variant="secondary"
                className="w-auto!"
                onClick={() => void load()}
              >
                Try again
              </Button>
            }
          />
        </AdminCard>
      ) : null}

      {data ? (
        <div className="grid gap-6">
          <AdminCard
            title="Sending"
            action={
              <AdminStatusBadge
                status={data.configured ? "sent" : "pending"}
                label={data.configured ? "Connected" : "Not set up"}
              />
            }
          >
            {data.configured ? (
              <dl className="grid gap-x-6 gap-y-4 px-5 py-5 sm:grid-cols-3 sm:px-6">
                {[
                  ["Sends from", data.from],
                  ["Customer replies go to", data.replyTo],
                  ["Store alerts go to", data.adminRecipients.join(", ")],
                ].map(([label, value]) => (
                  <div key={label} className="min-w-0">
                    <dt className="text-sm font-semibold text-admin-muted">
                      {label}
                    </dt>
                    <dd className="mt-1 wrap-break-word text-[0.9375rem] text-admin-ink">
                      {value || "Not set"}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="px-5 py-5 text-[0.9375rem] text-admin-ink sm:px-6">
                {NOT_SET_UP} Orders still go through.
              </p>
            )}
          </AdminCard>

          <AdminCard title="Templates">
            <div className="grid lg:grid-cols-[minmax(0,20rem)_1fr]">
              <ul
                className="max-h-88 overflow-y-auto border-b border-admin-line lg:max-h-184 lg:border-b-0 lg:border-r"
                aria-label="Email templates"
              >
                {data.templates.map((t) => {
                  const on = selected === t.index;
                  return (
                    <li key={t.index}>
                      <button
                        type="button"
                        onClick={() => setSelected(t.index)}
                        aria-current={on ? "true" : undefined}
                        className={cn(
                          "relative w-full cursor-pointer border-b border-admin-line px-5 py-3 text-left transition-colors sm:px-6",
                          on ? "bg-admin-soft" : "hover:bg-admin-soft-2",
                        )}
                      >
                        {on ? (
                          <span
                            aria-hidden
                            className="absolute inset-y-0 left-0 w-0.75 bg-brass"
                          />
                        ) : null}
                        <span className="block text-[0.9375rem] font-semibold text-admin-ink">
                          {t.label}
                        </span>
                        <span className="mt-0.5 block pr-7 text-[0.8125rem] text-admin-muted">
                          To {t.audience === "Customer" ? "customer" : "store team"}{" "}
                          · {t.trigger}
                        </span>
                        <span
                          aria-hidden
                          className={cn(
                            "absolute right-4 top-1/2 -translate-y-1/2 sm:right-5",
                            on ? "text-admin-ink" : "text-admin-faint",
                          )}
                        >
                          <AdminIcon name="view" size={17} />
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              <div className="min-w-0 p-5 sm:p-6">
                <div className="mb-4 min-w-0">
                  <p className="text-sm font-semibold text-admin-muted">Subject</p>
                  <p className="mt-0.5 truncate text-[0.9375rem] font-semibold text-admin-ink">
                    {preview?.subject || "Loading…"}
                  </p>
                </div>

                {preview ? (
                  <iframe
                    title={`Preview: ${current?.label || "email"}`}
                    srcDoc={preview.html}
                    sandbox=""
                    className="h-128 w-full rounded-md border border-admin-line bg-white lg:h-152"
                  />
                ) : (
                  <div className="flex h-128 items-center justify-center rounded-md border border-admin-line bg-admin-soft-2 lg:h-152">
                    <BrandLoader size={56} label="Loading preview" />
                  </div>
                )}

                {user?.isSuperAdmin && data.configured ? (
                  <form
                    ref={testFormRef}
                    onSubmit={sendTest}
                    noValidate
                    className="mt-5 flex flex-col gap-3 border-t border-admin-line pt-5 sm:flex-row sm:items-start"
                  >
                    <div className="min-w-0 flex-1" data-field="to">
                      <AdminFieldLabel htmlFor="email-test-to" required>
                        Send a test to
                      </AdminFieldLabel>
                      <Input
                        id="email-test-to"
                        name="to"
                        type="email"
                        value={testTo}
                        aria-invalid={tv.errors.to ? true : undefined}
                        onChange={(e) => {
                          setTestTo(e.target.value);
                          if (tv.submitted) tv.revalidate({ to: e.target.value });
                        }}
                        onBlur={() => tv.revalidate({ to: testTo })}
                      />
                      <AdminFieldError message={tv.errors.to} />
                    </div>
                    <Button
                      type="submit"
                      disabled={sending}
                      className="sm:mt-7 sm:w-auto"
                    >
                      {sending ? "Sending…" : "Send test"}
                    </Button>
                  </form>
                ) : null}
              </div>
            </div>
          </AdminCard>

          <AdminCard title="Sent emails">
            <div className="border-b border-admin-line px-5 py-3.5 sm:px-6">
              <AdminFilterChips
                label="Filter sent emails"
                value={filter}
                onChange={setFilter}
                options={LOG_FILTERS}
              />
            </div>
            {data.logs.length ? (
              <AdminTable
                flush
                className={cn(logLoading && "opacity-60 transition-opacity")}
              >
                <thead>
                  <tr>
                    <AdminTh>Email</AdminTh>
                    <AdminTh>To</AdminTh>
                    <AdminTh>Status</AdminTh>
                    <AdminTh>Order</AdminTh>
                    <AdminTh>Sent</AdminTh>
                    <AdminTh className="w-16 text-right">
                      <span className="sr-only">Actions</span>
                    </AdminTh>
                  </tr>
                </thead>
                <tbody>
                  {data.logs.map((l) => (
                    <tr
                      key={l.id}
                      className="transition-colors hover:bg-admin-soft-2"
                    >
                      <AdminTd className="max-w-88">
                        <span className="block font-medium">
                          {sentence(l.template)}
                        </span>
                        <span
                          className="block truncate text-[0.8125rem] text-admin-muted"
                          title={l.subject}
                        >
                          {l.subject}
                        </span>
                      </AdminTd>
                      <AdminTd className="max-w-64">
                        <span className="block truncate" title={l.to}>
                          {l.to}
                        </span>
                      </AdminTd>
                      <AdminTd>
                        <AdminStatusBadge status={l.status} />
                      </AdminTd>
                      <AdminTd className="whitespace-nowrap">
                        {l.ref === "test" ? (
                          <span className="text-admin-muted">Test</span>
                        ) : l.ref ? (
                          <Link
                            href={`/admin/orders/${encodeURIComponent(l.ref)}`}
                            className="font-mono text-[0.875rem] font-semibold text-admin-accent hover:underline"
                          >
                            {formatOrderNumber(l.ref)}
                          </Link>
                        ) : (
                          <span className="text-admin-faint">None</span>
                        )}
                      </AdminTd>
                      <AdminTd className="whitespace-nowrap text-admin-muted">
                        {formatDate(l.createdAt)}
                      </AdminTd>
                      <AdminTd className="py-2">
                        <AdminRowActions>
                          <AdminIconAction
                            icon="view"
                            label="View details"
                            ariaLabel={`View details of the email to ${l.to}`}
                            onClick={() => setLogDetail(l)}
                          />
                        </AdminRowActions>
                      </AdminTd>
                    </tr>
                  ))}
                </tbody>
              </AdminTable>
            ) : (
              <AdminEmptyState
                title={filter === "all" ? "No emails sent yet" : "Nothing here"}
                description={
                  filter === "all"
                    ? "Order and contact emails appear here once they go out."
                    : undefined
                }
              />
            )}
          </AdminCard>

          <AdminCard title="Newsletter subscribers">
            <dl className="grid grid-cols-2 gap-px border-b border-admin-line bg-admin-line">
              {(
                [
                  ["Subscribed", data.subscribers.subscribed],
                  ["Unsubscribed", data.subscribers.unsubscribed],
                ] as const
              ).map(([label, n]) => (
                <div key={label} className="bg-admin-paper px-5 py-4 sm:px-6">
                  <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-admin-muted">
                    {label}
                  </dt>
                  <dd className="mt-1 text-[1.75rem] font-semibold leading-tight tabular-nums text-admin-ink">
                    {n}
                  </dd>
                </div>
              ))}
            </dl>
            {data.subscribers.recent.length ? (
              <AdminTable flush>
                <thead>
                  <tr>
                    <AdminTh>Email</AdminTh>
                    <AdminTh>Status</AdminTh>
                    <AdminTh>Signed up from</AdminTh>
                    <AdminTh>Joined</AdminTh>
                    <AdminTh className="w-16 text-right">
                      <span className="sr-only">Actions</span>
                    </AdminTh>
                  </tr>
                </thead>
                <tbody>
                  {data.subscribers.recent.map((s) => {
                    const on = s.status === "subscribed";
                    return (
                      <tr
                        key={s.email}
                        className="transition-colors hover:bg-admin-soft-2"
                      >
                        <AdminTd className="max-w-72">
                          <span className="block truncate" title={s.email}>
                            {s.email}
                          </span>
                        </AdminTd>
                        <AdminTd>
                          <AdminStatusBadge
                            status={on ? "subscribed" : "unsubscribed"}
                            label={on ? "Subscribed" : "Unsubscribed"}
                          />
                        </AdminTd>
                        <AdminTd className="text-admin-muted">
                          {sentence(s.source) || "Store"}
                        </AdminTd>
                        <AdminTd className="whitespace-nowrap text-admin-muted">
                          {formatDate(s.createdAt)}
                        </AdminTd>
                        <AdminTd className="py-2">
                          <AdminRowActions>
                            <AdminIconAction
                              icon="email"
                              label="Email"
                              ariaLabel={`Email ${s.email}`}
                              href={`mailto:${s.email}`}
                            />
                          </AdminRowActions>
                        </AdminTd>
                      </tr>
                    );
                  })}
                </tbody>
              </AdminTable>
            ) : (
              <AdminEmptyState
                title="No subscribers yet"
                description="People who join the newsletter appear here."
              />
            )}
          </AdminCard>
        </div>
      ) : null}
      <AdminModal
        open={logDetail !== null}
        onClose={() => setLogDetail(null)}
        title="Email details"
        wide
      >
        {logDetail ? (
          <dl className="divide-y divide-admin-line text-[0.9375rem]">
            {(
              [
                ["Email", sentence(logDetail.template)],
                ["Subject", logDetail.subject || "No subject"],
                ["To", logDetail.to],
                ["Sent", formatDate(logDetail.createdAt)],
              ] as const
            ).map(([k, val]) => (
              <div key={k} className="grid gap-1 py-3 sm:grid-cols-[8rem_1fr] sm:gap-4">
                <dt className="font-semibold text-admin-muted">{k}</dt>
                <dd className="min-w-0 break-words text-admin-ink">{val}</dd>
              </div>
            ))}
            <div className="grid gap-1 py-3 sm:grid-cols-[8rem_1fr] sm:gap-4">
              <dt className="font-semibold text-admin-muted">Status</dt>
              <dd>
                <AdminStatusBadge status={logDetail.status} />
              </dd>
            </div>
            {logDetail.ref && logDetail.ref !== "test" ? (
              <div className="grid gap-1 py-3 sm:grid-cols-[8rem_1fr] sm:gap-4">
                <dt className="font-semibold text-admin-muted">Order</dt>
                <dd>
                  <Link
                    href={`/admin/orders/${encodeURIComponent(logDetail.ref)}`}
                    className="font-mono font-semibold text-admin-accent hover:underline"
                  >
                    {formatOrderNumber(logDetail.ref)}
                  </Link>
                </dd>
              </div>
            ) : null}
            {logDetail.error ? (
              <div className="grid gap-1 py-3 sm:grid-cols-[8rem_1fr] sm:gap-4">
                <dt className="font-semibold text-admin-muted">Why it failed</dt>
                <dd className="min-w-0">
                  <p className="text-admin-ink">
                    {/not configured|SMTP|APP_PASSWORD/i.test(logDetail.error)
                      ? NOT_SET_UP
                      : "The mail server refused this email. Share the note below with your developer."}
                  </p>
                  {!/not configured/i.test(logDetail.error) ? (
                    <p className="mt-2 whitespace-pre-wrap break-words rounded-md border border-admin-line bg-admin-soft-2 p-3 font-mono text-[0.8125rem] leading-relaxed text-admin-muted">
                      {logDetail.error}
                    </p>
                  ) : null}
                </dd>
              </div>
            ) : null}
          </dl>
        ) : null}
      </AdminModal>
    </AdminShell>
  );
}
