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
  "bg-admin-soft-2! text-admin-ink! placeholder:text-admin-faint! disabled:bg-admin-soft! disabled:text-admin-muted!";
/** Border colours forced over the storefront ones; the error colour wins when there is an error. */
const border = (error?: string) =>
  error ? "border-admin-danger! focus:border-admin-danger!" : "border-admin-input-border! focus:border-brass!";

export function Input({ className, ...props }: ComponentProps<typeof BaseInput>) {
  return <BaseInput className={cn(FIELD, border(props.error), "min-h-11!", className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: ComponentProps<typeof BaseTextarea>) {
  return (
    <BaseTextarea
      className={cn(FIELD, border(props.error), "leading-relaxed", className)}
      {...props}
    />
  );
}
