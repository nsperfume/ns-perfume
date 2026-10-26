import { ROLE_LABELS, normalizeRole, type AdminRole } from "@/lib/admin-token";

/** What each role can do, in the owner's words. Shared with the invite email. */
export const ROLE_ACCESS: Record<AdminRole, string> = {
  super_admin: "Everything, including the team, store charges and deleting",
  admin: "View and change orders, products, collections, content, messages and coupons",
  viewer: "View everything, change nothing",
};

export const ROLE_FROM_INPUT: Record<string, AdminRole> = { owner: "super_admin", editor: "admin", viewer: "viewer" };

export type MemberDoc = {
  _id: unknown;
  email: string;
  name?: string;
  role?: string;
  active?: boolean;
  mustChangePassword?: boolean;
  lastLoginAt?: Date | null;
  createdAt?: Date;
  createdBy?: string;
};

export function toMember(u: MemberDoc, selfId: string) {
  const role = normalizeRole(u.role);
  return {
    id: String(u._id),
    email: u.email,
    name: u.name || "",
    role,
    roleLabel: ROLE_LABELS[role],
    active: u.active !== false,
    mustChangePassword: Boolean(u.mustChangePassword),
    lastLoginAt: u.lastLoginAt ? new Date(u.lastLoginAt).toISOString() : null,
    createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : null,
    createdBy: u.createdBy || "",
    isYou: String(u._id) === selfId,
  };
}

