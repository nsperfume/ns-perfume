"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";

const CollectionsNavContext = createContext<ReadonlySet<string> | null>(null);

/** Handles of collections that have perfumes, so menus never lead to an empty page. */
export function CollectionsNavProvider({
  handles,
  children,
}: {
  handles: string[];
  children: ReactNode;
}) {
  const value = useMemo(() => new Set(handles), [handles]);
  return <CollectionsNavContext.Provider value={value}>{children}</CollectionsNavContext.Provider>;
}

/** Filter for menu links: other pages always pass; collection links pass while they have perfumes. */
export function useShowNavLink() {
  const handles = useContext(CollectionsNavContext);
  return useCallback(
    (link: { href?: string }) => {
      const handle = link.href?.match(/^\/collections\/([^/?#]+)/)?.[1];
      return !handle || !handles || handles.has(handle);
    },
    [handles],
  );
}
