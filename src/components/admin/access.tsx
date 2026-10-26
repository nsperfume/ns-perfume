"use client";

import { createContext, useContext } from "react";

/** What the signed-in admin may do. Provided by AdminShell, read by buttons and actions. */
export type AdminAccess = { canWrite: boolean; isOwner: boolean };

const AdminAccessContext = createContext<AdminAccess>({ canWrite: true, isOwner: false });

export const AdminAccessProvider = AdminAccessContext.Provider;

export function useAdminAccess() {
  return useContext(AdminAccessContext);
}

/** Tooltip/aria text for controls switched off for view-only accounts. */
export const READ_ONLY_HINT = "View only: ask the owner if you need to make changes";
