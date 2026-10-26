"use client";

import type { ComponentProps } from "react";
import { Select as BaseSelect } from "@/components/ui/select";
import { cn } from "@/lib/cn";

/*
 * Shared Select with admin field tokens: 44px trigger, 15px label text,
 * admin border/fill in light and dark. Call sites can still pass
 * `triggerClassName` (e.g. size-sm in table rows).
 */
const TRIGGER =
  "min-h-11! border-admin-input-border! bg-admin-soft-2! text-admin-ink! text-[0.9375rem]! font-medium hover:border-admin-muted! data-[state=open]:border-brass!";

export function Select({
  triggerClassName,
  ...props
}: ComponentProps<typeof BaseSelect>) {
  return (
    <BaseSelect triggerClassName={cn(TRIGGER, triggerClassName)} {...props} />
  );
}
