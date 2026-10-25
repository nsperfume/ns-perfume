"use client";

import type { ComponentProps } from "react";
import {
  Input as BaseInput,
  Textarea as BaseTextarea,
} from "@/components/ui/input";
import { cn } from "@/lib/cn";

/*
 * Shared inputs hard-code a light border and paper fill. In the console they
 * follow the admin field tokens (both themes) and match `adminFieldClass`.
 */
const FIELD =
  "border-admin-input-border! bg-admin-soft-2! text-admin-ink! placeholder:text-admin-faint! focus:border-brass! disabled:bg-admin-soft! disabled:text-admin-muted!";

export function Input({ className, ...props }: ComponentProps<typeof BaseInput>) {
  return <BaseInput className={cn(FIELD, "min-h-11!", className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: ComponentProps<typeof BaseTextarea>) {
  return (
    <BaseTextarea
      className={cn(FIELD, "leading-relaxed", className)}
      {...props}
    />
  );
}
