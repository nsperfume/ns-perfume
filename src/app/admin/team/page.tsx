"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  AdminCard,
  AdminEmptyState,
  AdminIconAction,
  AdminModal,
  AdminNotice,
  AdminPageHeader,
  AdminRowActions,
  AdminStatusBadge,
  readAdminJson,
  type AdminTone,
} from "@/components/admin/ui";
import { Button } from "@/components/admin/button";
import { Input } from "@/components/admin/input";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { AdminFormError } from "@/components/admin/form-validation";
import { toast } from "@/components/admin/toast";
import { BrandLoaderBlock } from "@/components/brand/brand-loader";
import { useAdminUser } from "@/components/admin/use-admin-user";
import { PASSWORD_HINT, clientPasswordProblem } from "@/lib/admin-password";
import { cn } from "@/lib/cn";

type Role = "super_admin" | "admin" | "viewer";
type RoleInput = "owner" | "editor" | "viewer";

type Member = {
  id: string;
  email: string;
  name: string;
  role: Role;
  roleLabel: string;
  active: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string | null;
  isYou: boolean;
};

const ROLE_INPUT: Record<Role, RoleInput> = { super_admin: "owner", admin: "editor", viewer: "viewer" };
const ROLE_TONE: Record<Role, AdminTone> = { super_admin: "brass", admin: "ink", viewer: "neutral" };

const ROLE_CHOICES: { value: RoleInput; label: string; body: string }[] = [
  { value: "editor", label: "Editor", body: "View and change orders, products, collections, content, messages and coupons. Cannot delete, manage the team or change store charges." },
  { value: "viewer", label: "Viewer", body: "View everything, change nothing. Good for an accountant or a new helper." },
  { value: "owner", label: "Owner", body: "Everything, including the team, store charges and deleting. Give this only to a business partner." },
];

/** 14 characters without look-alikes (0/O, 1/l/I), always with letters and digits. */
function generatePassword() {
  const letters = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ";
  const digits = "23456789";
  const all = letters + digits;
  const bytes = crypto.getRandomValues(new Uint32Array(14));
  const chars = Array.from(bytes, (b) => all[b % all.length]!);
  chars[3] = digits[bytes[3]! % digits.length]!;
  chars[9] = letters[bytes[9]! % letters.length]!;
  return chars.join("");
}

function when(iso: string | null) {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Karachi" });
}

function RolePicker({ value, onChange, name }: { value: RoleInput; onChange: (v: RoleInput) => void; name: string }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-admin-ink">
        What can they do?<span aria-hidden className="ml-0.5 text-admin-danger">*</span>
      </legend>
      <div className="grid gap-2">
        {ROLE_CHOICES.map((c) => (
          <label
            key={c.value}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors has-focus-visible:ring-2 has-focus-visible:ring-brass/50",
              value === c.value ? "border-brass bg-admin-soft-2" : "border-admin-line hover:border-admin-muted",
            )}
          >
            <input
              type="radio"
              name={name}
              value={c.value}
              checked={value === c.value}
              onChange={() => onChange(c.value)}
              className="mt-1 accent-[#a9873c]"
            />
            <span>
              <span className="block text-[0.9375rem] font-semibold text-admin-ink">{c.label}</span>
              <span className="block text-sm text-admin-muted">{c.body}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Temporary password field with Generate; the owner shares it once, the person replaces it at first sign-in. */
function TempPasswordField({ value, onChange, error }: { value: string; onChange: (v: string) => void; error?: string }) {
  return (
    <div>
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <Input
            label="Temporary password"
            name="password"
            required
            value={value}
            error={error}
            hint={error ? undefined : `${PASSWORD_HINT} They choose their own when they first sign in.`}
            onChange={(e) => onChange(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      </div>
      <button
        type="button"
        onClick={() => onChange(generatePassword())}
        className="mt-2 inline-flex min-h-9 cursor-pointer items-center text-sm font-semibold text-admin-accent hover:underline"
      >
        Generate a strong password
      </button>
    </div>
  );
}

/** One-time panel with the details to share, shown after adding someone or resetting a password. */
function ShareDetails({ email, password, onDone }: { email: string; password: string; onDone: () => void }) {
  const text = `Sign in at ${window.location.origin}/admin/login\nEmail: ${email}\nTemporary password: ${password}`;
  return (
    <div className="space-y-4">
      <p className="text-[0.9375rem] text-admin-ink">
        Share these details privately, for example on WhatsApp. The password is shown only now.
      </p>
      <pre className="whitespace-pre-wrap rounded-md border border-admin-line bg-admin-soft-2 p-4 font-sans text-[0.9375rem] leading-relaxed text-admin-ink">
        {text}
      </pre>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onDone}>
          Done
        </Button>
        <Button
          onClick={() =>
            navigator.clipboard
              .writeText(text)
              .then(() => toast.success("Copied"))
              .catch(() => toast.error("Could not copy. Select the text instead."))
          }
        >
          Copy details
        </Button>
      </div>
    </div>
  );
}

export default function AdminTeamPage() {
  const { user } = useAdminUser();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [emailReady, setEmailReady] = useState(false);

  // Add
  const [addOpen, setAddOpen] = useState(false);
  const [add, setAdd] = useState({ name: "", email: "", role: "editor" as RoleInput, password: "", sendEmail: false });
  const [addErrors, setAddErrors] = useState<Record<string, string>>({});
  const [addError, setAddError] = useState("");
  const [saving, setSaving] = useState(false);
  const [shared, setShared] = useState<{ email: string; password: string } | null>(null);

  // Edit / reset / confirm
  const [editing, setEditing] = useState<Member | null>(null);
  const [edit, setEdit] = useState({ name: "", role: "editor" as RoleInput });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [resetFor, setResetFor] = useState<Member | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [toggleFor, setToggleFor] = useState<Member | null>(null);
  const [removeFor, setRemoveFor] = useState<Member | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError("");
    fetch("/api/admin/team")
      .then((r) => readAdminJson<{ members: Member[]; emailConfigured: boolean }>(r))
      .then((j) => {
        if (j.ok && j.data) {
          setMembers(j.data.members);
          setEmailReady(j.data.emailConfigured);
        } else setLoadError(j.error || "Could not load the team");
      })
      .catch(() => setLoadError("Could not load the team. Check your connection."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user?.isSuperAdmin) load();
    else if (user) setLoading(false);
  }, [user, load]);

  async function send(url: string, method: string, body?: unknown) {
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = (await res.json().catch(() => null)) as {
      ok?: boolean;
      error?: string;
      data?: { member?: Member };
      details?: { fieldErrors?: Record<string, string> };
    } | null;
    return json ?? { ok: false, error: `Request failed (${res.status})` };
  }

  function upsert(m: Member) {
    setMembers((list) => (list.some((x) => x.id === m.id) ? list.map((x) => (x.id === m.id ? m : x)) : [...list, m]));
  }

  async function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError("");
    const errs: Record<string, string> = {};
    if (add.name.trim().length < 2) errs.name = "Enter their name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(add.email.trim())) errs.email = add.email.trim() ? "Enter a valid email address" : "Enter their email";
    const p = clientPasswordProblem(add.password);
    if (p) errs.password = p === "Enter a new password" ? "Set a temporary password" : p;
    setAddErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      const j = await send("/api/admin/team", "POST", { ...add, name: add.name.trim(), email: add.email.trim() });
      if (!j.ok || !j.data?.member) {
        const fe = j.details?.fieldErrors ?? {};
        if (Object.keys(fe).length) setAddErrors(fe);
        else setAddError(j.error || "Could not add this person");
        return;
      }
      upsert(j.data.member);
      toast.success(`${j.data.member.name} added as ${j.data.member.roleLabel}`);
      setShared({ email: j.data.member.email, password: add.password });
    } finally {
      setSaving(false);
    }
  }

  function closeAdd() {
    setAddOpen(false);
    setShared(null);
    setAdd({ name: "", email: "", role: "editor", password: "", sendEmail: false });
    setAddErrors({});
    setAddError("");
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    if (edit.name.trim().length < 2) return setEditErrors({ name: "Enter their name" });
    setSaving(true);
    try {
      const body: Record<string, unknown> = { name: edit.name.trim() };
      if (!editing.isYou && edit.role !== ROLE_INPUT[editing.role]) body.role = edit.role;
      const j = await send(`/api/admin/team/${editing.id}`, "PATCH", body);
      if (!j.ok || !j.data?.member) {
        const fe = j.details?.fieldErrors ?? {};
        if (Object.keys(fe).length) setEditErrors(fe);
        else toast.error(j.error || "Could not save");
        return;
      }
      upsert(j.data.member);
      toast.success("Changes saved");
      setEditing(null);
    } finally {
      setSaving(false);
    }
  }

  async function submitReset(e: React.FormEvent) {
    e.preventDefault();
    if (!resetFor) return;
    const p = clientPasswordProblem(resetPassword);
    if (p) return setResetError(p === "Enter a new password" ? "Set a temporary password" : p);
    setSaving(true);
    try {
      const j = await send(`/api/admin/team/${resetFor.id}`, "PATCH", { password: resetPassword });
      if (!j.ok || !j.data?.member) {
        setResetError(j.details?.fieldErrors?.password || j.error || "Could not set the password");
        return;
      }
      upsert(j.data.member);
      toast.success(`New temporary password set. ${resetFor.name} was signed out.`);
      setShared({ email: resetFor.email, password: resetPassword });
    } finally {
      setSaving(false);
    }
  }

  async function confirmToggle() {
    if (!toggleFor) return;
    setSaving(true);
    try {
      const j = await send(`/api/admin/team/${toggleFor.id}`, "PATCH", { active: !toggleFor.active });
      if (!j.ok || !j.data?.member) {
        toast.error(j.error || "Could not update access");
        return;
      }
      upsert(j.data.member);
      toast.success(j.data.member.active ? `${toggleFor.name} can sign in again` : `${toggleFor.name} was signed out and turned off`);
      setToggleFor(null);
    } finally {
      setSaving(false);
    }
  }

  async function confirmRemove() {
    if (!removeFor) return;
    setSaving(true);
    try {
      const j = await send(`/api/admin/team/${removeFor.id}`, "DELETE");
      if (!j.ok) {
        toast.error(j.error || "Could not remove this person");
        return;
      }
      setMembers((list) => list.filter((m) => m.id !== removeFor.id));
      toast.success(`${removeFor.name} was removed`);
      setRemoveFor(null);
    } finally {
      setSaving(false);
    }
  }

  const ownerOnly = user && !user.isSuperAdmin;

  return (
    <AdminShell user={user}>
      <AdminPageHeader
        title="Team"
        description="Choose who can sign in to the admin and what they can do."
        action={
          user?.isSuperAdmin ? (
            <Button onClick={() => setAddOpen(true)}>Add person</Button>
          ) : null
        }
      />

      {ownerOnly ? (
        <AdminNotice>Only the owner can manage the team. Your own details are in <Link href="/admin/profile" className="font-semibold text-admin-accent hover:underline">Profile</Link>.</AdminNotice>
      ) : loading || !user ? (
        <BrandLoaderBlock className="min-h-[40vh]" label="Loading the team" />
      ) : loadError ? (
        <AdminNotice tone="error">
          {loadError}{" "}
          <button type="button" onClick={load} className="font-semibold underline">
            Try again
          </button>
        </AdminNotice>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
          <AdminCard title={`People (${members.length})`}>
            {members.length ? (
              <ul className="divide-y divide-admin-line">
                {members.map((m) => (
                  <li key={m.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 text-[0.9375rem] font-semibold text-admin-ink">
                        <span className="truncate">{m.name || m.email}</span>
                        {m.isYou ? <span className="text-sm font-normal text-admin-muted">(you)</span> : null}
                      </p>
                      <p className="truncate text-sm text-admin-muted">{m.email}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <AdminStatusBadge status="role" label={m.roleLabel} tone={ROLE_TONE[m.role]} />
                        {!m.active ? <AdminStatusBadge status="cancelled" label="Turned off" /> : null}
                        {m.active && m.mustChangePassword ? <AdminStatusBadge status="pending" label="Waiting for first sign in" /> : null}
                        <span className="text-sm text-admin-muted">Last sign in: {when(m.lastLoginAt)}</span>
                      </div>
                    </div>
                    {m.isYou ? (
                      <Link href="/admin/profile" className="text-sm font-semibold text-admin-accent hover:underline sm:shrink-0">
                        Edit your profile
                      </Link>
                    ) : (
                      <AdminRowActions className="sm:shrink-0">
                        <AdminIconAction
                          icon="edit"
                          label="Edit name or role"
                          ariaLabel={`Edit ${m.name}`}
                          onClick={() => {
                            setEditing(m);
                            setEdit({ name: m.name, role: ROLE_INPUT[m.role] });
                            setEditErrors({});
                          }}
                        />
                        <AdminIconAction
                          icon="send"
                          label="Set a new temporary password"
                          ariaLabel={`Set a new temporary password for ${m.name}`}
                          onClick={() => {
                            setResetFor(m);
                            setResetPassword(generatePassword());
                            setResetError("");
                            setShared(null);
                          }}
                        />
                        <AdminIconAction
                          icon={m.active ? "hide" : "publish"}
                          label={m.active ? "Turn off access" : "Turn access back on"}
                          ariaLabel={`${m.active ? "Turn off" : "Turn on"} access for ${m.name}`}
                          onClick={() => setToggleFor(m)}
                        />
                        <AdminIconAction
                          icon="remove-user"
                          tone="danger"
                          label="Remove from team"
                          ariaLabel={`Remove ${m.name} from the team`}
                          onClick={() => setRemoveFor(m)}
                        />
                      </AdminRowActions>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <AdminEmptyState title="Just you so far" description="Add a person to share the work." />
            )}
          </AdminCard>

          <AdminCard title="What each role can do">
            <ul className="space-y-4 px-5 py-5 sm:px-6">
              {[ROLE_CHOICES[2]!, ROLE_CHOICES[0]!, ROLE_CHOICES[1]!].map((c) => (
                <li key={c.value}>
                  <p className="text-[0.9375rem] font-semibold text-admin-ink">{c.label}</p>
                  <p className="text-sm text-admin-muted">{c.body}</p>
                </li>
              ))}
              <li className="border-t border-admin-line pt-4 text-sm text-admin-muted">
                Turning someone off or giving them a new password signs them out straight away. The store always keeps at least one owner.
              </li>
            </ul>
          </AdminCard>
        </div>
      )}

      {/* Add person */}
      <AdminModal open={addOpen} onClose={closeAdd} title={shared ? "Person added" : "Add a person"}>
        {shared ? (
          <ShareDetails email={shared.email} password={shared.password} onDone={closeAdd} />
        ) : (
          <form onSubmit={submitAdd} noValidate className="space-y-5">
            <Input label="Name" name="name" required value={add.name} error={addErrors.name} onChange={(e) => setAdd({ ...add, name: e.target.value })} autoComplete="off" />
            <Input label="Email" name="email" type="email" required value={add.email} error={addErrors.email} onChange={(e) => setAdd({ ...add, email: e.target.value })} autoComplete="off" />
            <RolePicker name="add-role" value={add.role} onChange={(role) => setAdd({ ...add, role })} />
            <TempPasswordField value={add.password} error={addErrors.password} onChange={(password) => setAdd({ ...add, password })} />
            <label className={cn("flex items-start gap-3 text-sm", emailReady ? "cursor-pointer text-admin-ink" : "text-admin-muted")}>
              <input
                type="checkbox"
                checked={add.sendEmail && emailReady}
                disabled={!emailReady}
                onChange={(e) => setAdd({ ...add, sendEmail: e.target.checked })}
                className="mt-0.5 accent-[#a9873c]"
              />
              <span>
                Email them how to sign in (the password is never emailed)
                {!emailReady ? <span className="block">Turn on email in your settings to use this.</span> : null}
              </span>
            </label>
            {addError ? <AdminFormError>{addError}</AdminFormError> : null}
            <div className="flex flex-col-reverse gap-2 border-t border-admin-line pt-4 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={closeAdd}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Adding…" : "Add person"}
              </Button>
            </div>
          </form>
        )}
      </AdminModal>

      {/* Edit */}
      <AdminModal open={!!editing} onClose={() => setEditing(null)} title={editing ? `Edit ${editing.name}` : "Edit"}>
        {editing ? (
          <form onSubmit={submitEdit} noValidate className="space-y-5">
            <Input label="Name" name="name" required value={edit.name} error={editErrors.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
            <Input label="Email" name="email" value={editing.email} disabled hint="To use a different email, add the person again and remove this account." />
            <RolePicker name="edit-role" value={edit.role} onChange={(role) => setEdit({ ...edit, role })} />
            {editErrors.role ? <AdminFormError>{editErrors.role}</AdminFormError> : null}
            <div className="flex flex-col-reverse gap-2 border-t border-admin-line pt-4 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        ) : null}
      </AdminModal>

      {/* New temporary password */}
      <AdminModal
        open={!!resetFor}
        onClose={() => {
          setResetFor(null);
          setShared(null);
        }}
        title={shared ? "New password set" : resetFor ? `New password for ${resetFor.name}` : "New password"}
      >
        {shared ? (
          <ShareDetails email={shared.email} password={shared.password} onDone={() => { setResetFor(null); setShared(null); }} />
        ) : resetFor ? (
          <form onSubmit={submitReset} noValidate className="space-y-5">
            <p className="text-[0.9375rem] text-admin-ink">
              {resetFor.name} will be signed out everywhere and must choose their own password at the next sign in.
            </p>
            <TempPasswordField value={resetPassword} error={resetError} onChange={(v) => { setResetPassword(v); setResetError(""); }} />
            <div className="flex flex-col-reverse gap-2 border-t border-admin-line pt-4 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={() => setResetFor(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Set password"}
              </Button>
            </div>
          </form>
        ) : null}
      </AdminModal>

      <ConfirmDialog
        open={!!toggleFor}
        onOpenChange={(o) => !o && setToggleFor(null)}
        title={toggleFor?.active ? `Turn off ${toggleFor?.name}?` : `Turn ${toggleFor?.name} back on?`}
        description={
          toggleFor?.active
            ? "They are signed out straight away and cannot sign in until you turn them back on. Nothing they did is deleted."
            : "They can sign in again with their current password."
        }
        confirmLabel={toggleFor?.active ? "Turn off" : "Turn on"}
        tone={toggleFor?.active ? "danger" : "default"}
        loading={saving}
        onConfirm={confirmToggle}
      />

      <ConfirmDialog
        open={!!removeFor}
        onOpenChange={(o) => !o && setRemoveFor(null)}
        title={`Remove ${removeFor?.name}?`}
        description="They lose access straight away. Orders and products they worked on stay as they are. To pause access instead, turn them off."
        confirmLabel="Remove"
        loading={saving}
        onConfirm={confirmRemove}
      />
    </AdminShell>
  );
}
