"use client";

import { cn } from "@/lib/cn";
import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

const fieldBase =
  "w-full rounded-md border border-hairline bg-paper px-3.5 py-3 text-base text-ink outline-none transition-[border-color,box-shadow] placeholder:text-taupe/70 focus:border-brass focus:ring-2 focus:ring-brass/20";

const labelFloat =
  "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-display text-sm text-taupe transition-all peer-focus:top-2.5 peer-focus:translate-y-0 peer-focus:text-xs peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs";

export function CheckoutField({
  id,
  label,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div className={cn("relative", className)}>
      <input
        id={id}
        placeholder=" "
        className={cn(fieldBase, "peer pt-5 pb-2.5 font-serif")}
        {...props}
      />
      <label htmlFor={id} className={labelFloat}>
        {label}
      </label>
    </div>
  );
}

export function CheckoutSelect({
  id,
  label,
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <div className={cn("relative", className)}>
      <select
        id={id}
        className={cn(fieldBase, "appearance-none pt-5 pb-2.5 pr-9 font-serif")}
        {...props}
      >
        {children}
      </select>
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-3.5 top-2.5 font-display text-xs text-taupe"
      >
        {label}
      </label>
      <span
        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-taupe"
        aria-hidden
      >
        ▾
      </span>
    </div>
  );
}

export function CheckoutTextarea({
  id,
  label,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <div className={cn("relative", className)}>
      <textarea
        id={id}
        placeholder=" "
        className={cn(
          fieldBase,
          "peer min-h-[5.5rem] resize-y pt-6 pb-2.5 font-serif",
        )}
        {...props}
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-3.5 top-3 font-display text-xs text-taupe peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-3 peer-focus:text-xs"
      >
        {label}
      </label>
    </div>
  );
}

export function CheckoutCheckbox({
  id,
  label,
  checked,
  onChange,
  className,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  className?: string;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-3 font-serif text-base leading-snug text-taupe",
        className,
      )}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-hairline accent-ink"
      />
      <span>{label}</span>
    </label>
  );
}

export function CheckoutError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 font-display text-sm text-rosewood">{message}</p>;
}
