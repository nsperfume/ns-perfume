"use client";

import { cn } from "@/lib/cn";
import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

const fieldBase =
  "min-h-14 w-full rounded-xs border border-[#d6cfbf] bg-paper px-4 py-3 text-base text-ink outline-none transition-[border-color,box-shadow] placeholder:text-taupe/70 hover:border-ink/40 focus:border-brass focus:ring-2 focus:ring-brass/25";

const labelFloat =
  "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base text-taupe transition-all peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:font-semibold peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:font-semibold";

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
        className={cn(fieldBase, "peer pt-6 pb-2")}
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
        className={cn(fieldBase, "appearance-none pt-6 pb-2 pr-10")}
        {...props}
      >
        {children}
      </select>
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-4 top-2 text-xs font-semibold text-taupe"
      >
        {label}
      </label>
      <span
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-taupe"
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
          "peer min-h-[7rem] resize-y pt-7 pb-2.5",
        )}
        {...props}
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-4 top-2 text-xs font-semibold text-taupe peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:font-normal peer-focus:top-2 peer-focus:text-xs peer-focus:font-semibold"
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
        "flex min-h-11 cursor-pointer items-center gap-3 text-base leading-snug text-taupe",
        className,
      )}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 shrink-0 cursor-pointer rounded border-hairline accent-ink"
      />
      <span>{label}</span>
    </label>
  );
}

export function CheckoutError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-sm font-medium text-rosewood">{message}</p>;
}
