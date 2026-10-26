"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminCard, AdminNotice, AdminPageHeader, AdminStatusBadge } from "@/components/admin/ui";
import { Button } from "@/components/admin/button";
import { Input } from "@/components/admin/input";
import { AdminFormError } from "@/components/admin/form-validation";
import { toast } from "@/components/admin/toast";
import { BrandLoaderBlock } from "@/components/brand/brand-loader";
import { useAdminUser } from "@/components/admin/use-admin-user";
import { AdminAccessProvider } from "@/components/admin/access";
import { PASSWORD_HINT, clientPasswordProblem } from "@/lib/admin-password";

type Profile = {
  email: string;
  name: string;
  role: string;
  roleLabel: string;
  lastLoginAt: string | null;
  passwordChangedAt: string | null;
  mustChangePassword: boolean;
};

const ACCESS: Record<string, string> = {
  super_admin: "You can see and change everything, including the team and store charges.",
  admin: "You can view and change orders, products, collections, content, messages and coupons.",
  viewer: "You can view everything in the admin. Changes are turned off for your account.",
};

function when(iso: string | null) {
  if (!iso) return "Not yet";
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Karachi",
  });
}

export default function AdminProfilePage() {
  const router = useRouter();
  const { user, setUser } = useAdminUser();
  const [profile, setProfile] = useState<Profile | null>(null);

  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [savingName, setSavingName] = useState(false);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    fetch("/api/admin/profile")
      .then((r) => r.json())
      .then((j) => {
        if (j?.ok) {
          setProfile(j.data);
          setName(j.data.name);
        }
      })
      .catch(() => {});
  }, []);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    const value = name.trim();
    if (value.length < 2) return setNameError("Enter your name");
    setNameError("");
    setSavingName(true);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: value }),
      });
      const j = await res.json().catch(() => null);
      if (!j?.ok) return toast.error(j?.error || "Could not save your name");
      setProfile((p) => (p ? { ...p, name: j.data.name } : p));
      setUser((u) => (u ? { ...u, name: j.data.name } : u));
      toast.success("Name saved");
    } finally {
      setSavingName(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    const nextErrors: Record<string, string> = {};
    if (!current) nextErrors.currentPassword = "Enter your current password";
    const problem = clientPasswordProblem(next);
    if (problem) nextErrors.newPassword = problem;
    if (!confirm) nextErrors.confirm = "Type the new password again";
    else if (confirm !== next) nextErrors.confirm = "The passwords do not match";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSavingPassword(true);
    try {
      const res = await fetch("/api/admin/profile/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const j = await res.json().catch(() => null);
      if (!j?.ok) {
        const fe = (j?.details?.fieldErrors ?? {}) as Record<string, string>;
        if (Object.keys(fe).length) setErrors(fe);
        else setFormError(j?.error || "Could not change the password");
        return;
      }
      setCurrent("");
      setNext("");
      setConfirm("");
      toast.success("Password updated. Other devices were signed out.");
      const wasForced = Boolean(user?.mustChangePassword);
      setUser((u) => (u ? { ...u, mustChangePassword: false, canWrite: u.role !== "viewer" } : u));
      setProfile((p) => (p ? { ...p, mustChangePassword: false, passwordChangedAt: new Date().toISOString() } : p));
      if (wasForced) router.push("/admin");
    } catch {
      setFormError("Network error. Check your connection and try again.");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <AdminShell user={user}>
      <AdminPageHeader title="Profile" description="Your sign-in details and password." />

      {user?.mustChangePassword ? (
        <AdminNotice tone="error">
          You signed in with a temporary password. Choose your own password below to start using the admin.
        </AdminNotice>
      ) : null}

      {/* Everyone can manage their own name and password, view-only or not. */}
      <AdminAccessProvider value={{ canWrite: true, isOwner: Boolean(user?.isSuperAdmin) }}>
      {!profile ? (
        <BrandLoaderBlock className="min-h-[40vh]" label="Loading your profile" />
      ) : (
        <div className="grid gap-6 xl:grid-cols-2 xl:items-start">
          <AdminCard title="Your details">
            <form onSubmit={saveName} noValidate className="space-y-5 px-5 py-5 sm:px-6">
              <Input
                label="Name"
                name="name"
                required
                value={name}
                error={nameError}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
              <Input label="Email" name="email" value={profile.email} disabled hint="Ask the owner if this needs to change." />
              <dl className="grid gap-4 rounded-md border border-admin-line bg-admin-soft-2 p-4 text-[0.9375rem] sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <dt className="text-[0.8125rem] text-admin-muted">Role</dt>
                  <dd className="mt-1 flex flex-wrap items-center gap-2">
                    <AdminStatusBadge status="role" label={profile.roleLabel} tone={profile.role === "super_admin" ? "brass" : profile.role === "viewer" ? "neutral" : "ink"} />
                    <span className="text-admin-muted">{ACCESS[profile.role]}</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.8125rem] text-admin-muted">Last sign in</dt>
                  <dd className="mt-1 font-semibold text-admin-ink">{when(profile.lastLoginAt)}</dd>
                </div>
                <div>
                  <dt className="text-[0.8125rem] text-admin-muted">Password changed</dt>
                  <dd className="mt-1 font-semibold text-admin-ink">{when(profile.passwordChangedAt)}</dd>
                </div>
              </dl>
              <div className="flex justify-end">
                <Button type="submit" disabled={savingName || name.trim() === profile.name}>
                  {savingName ? "Saving…" : "Save name"}
                </Button>
              </div>
            </form>
          </AdminCard>

          <AdminCard title={user?.mustChangePassword ? "Choose your password" : "Change password"}>
            <form onSubmit={savePassword} noValidate className="space-y-5 px-5 py-5 sm:px-6">
              <Input
                label={user?.mustChangePassword ? "Temporary password" : "Current password"}
                name="currentPassword"
                type="password"
                required
                value={current}
                error={errors.currentPassword}
                onChange={(e) => setCurrent(e.target.value)}
                autoComplete="current-password"
              />
              <Input
                label="New password"
                name="newPassword"
                type="password"
                required
                value={next}
                error={errors.newPassword}
                hint={PASSWORD_HINT}
                onChange={(e) => setNext(e.target.value)}
                autoComplete="new-password"
              />
              <Input
                label="Confirm new password"
                name="confirm"
                type="password"
                required
                value={confirm}
                error={errors.confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
              />
              {formError ? <AdminFormError>{formError}</AdminFormError> : null}
              <p className="text-sm text-admin-muted">Saving signs you out on every other device. This one stays signed in.</p>
              <div className="flex justify-end">
                <Button type="submit" disabled={savingPassword}>
                  {savingPassword ? "Saving…" : "Update password"}
                </Button>
              </div>
            </form>
          </AdminCard>
        </div>
      )}
      </AdminAccessProvider>
    </AdminShell>
  );
}
