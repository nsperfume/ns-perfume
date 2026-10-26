"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/** The signed-in admin as returned by GET /api/admin/auth. */
export type AdminMe = {
  email: string;
  name: string;
  sub: string;
  role: "super_admin" | "admin" | "viewer";
  roleLabel: string;
  isSuperAdmin: boolean;
  /** False for viewers and for anyone who still has to set their own password. */
  canWrite: boolean;
  mustChangePassword: boolean;
};

/** Load the signed-in admin; sends them to sign in when the session has ended. */
export function useAdminUser() {
  const router = useRouter();
  const [user, setUser] = useState<AdminMe | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/auth")
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (!j?.ok) router.replace(`/admin/login?next=${encodeURIComponent(window.location.pathname)}`);
        else setUser(j.data as AdminMe);
      })
      .catch(() => {
        /* network blip: keep what we have */
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  return { user, setUser };
}
