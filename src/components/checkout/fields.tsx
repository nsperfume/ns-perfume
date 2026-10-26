"use client";

import { cn } from "@/lib/cn";
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

/**
 * Floating-label checkout fields. Same contract as the shared Input in
 * components/ui/input.tsx: `required` adds an asterisk, `error` swaps the border
 * and message, `hint` sits under the field, and both are wired to
 * aria-invalid / aria-describedby.
 */
type FieldExtras = {
  label: string;
  error?: string;
  /** Helper line under the field, replaced by the error when there is one. */
  hint?: ReactNode;
};

const fieldBase =
  "min-h-14 w-full rounded-xs border bg-paper px-4 py-3 text-base text-ink outline-none transition-[border-color,box-shadow] placeholder:text-taupe/70 focus:ring-2";

/** Border and focus colours, picked as a pair so they never fight in the stylesheet. */
const toneClass = (error?: string) =>
  error
    ? "border-rosewood focus:border-rosewood focus:ring-rosewood/20"
    : "border-[#d6cfbf] hover:border-ink/40 focus:border-brass focus:ring-brass/25";

const labelFloat =
  "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base text-taupe transition-all peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:font-semibold peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:font-semibold";

function LabelText({ label, required }: { label: string; required?: boolean }) {
  return (
    <>
      {label}
      {required ? (
        <span aria-hidden="true" className="ml-0.5 text-rosewood">
          *
        </span>
      ) : null}
    </>
  );
}

function FieldMessage({ id, error, hint }: { id?: string; error?: string; hint?: ReactNode }) {
  if (error) {
    return (
      <p id={id} className="mt-1.5 text-sm font-medium text-rosewood">
        {error}
      </p>
    );
  }
  if (hint) {
    return (
      <p id={id} className="mt-1.5 text-sm text-taupe">
        {hint}
      </p>
    );
  }
  return null;
}

const messageIdFor = (id: string | undefined, error?: string, hint?: ReactNode) =>
  id && (error || hint) ? `${id}-message` : undefined;

export function CheckoutField({
  id,
  label,
  error,
  hint,
  className,
  required,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & FieldExtras) {
  const messageId = messageIdFor(id, error, hint);
  return (
    <div className={className}>
      <div className="relative">
        <input
          id={id}
          placeholder=" "
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={messageId}
          className={cn(fieldBase, toneClass(error), "peer pt-6 pb-2")}
          {...props}
        />
        <label htmlFor={id} className={labelFloat}>
          <LabelText label={label} required={required} />
        </label>
      </div>
      <FieldMessage id={messageId} error={error} hint={hint} />
    </div>
  );
}

export function CheckoutSelect({
  id,
  label,
  error,
  hint,
  className,
  required,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & FieldExtras) {
  const messageId = messageIdFor(id, error, hint);
  return (
    <div className={className}>
      <div className="relative">
        <select
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={messageId}
          className={cn(fieldBase, toneClass(error), "appearance-none pt-6 pb-2 pr-10")}
          {...props}
        >
          {children}
        </select>
        <label
          htmlFor={id}
          className="pointer-events-none absolute left-4 top-2 text-xs font-semibold text-taupe"
        >
          <LabelText label={label} required={required} />
        </label>
        <span
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-taupe"
          aria-hidden
        >
          ▾
        </span>
      </div>
      <FieldMessage id={messageId} error={error} hint={hint} />
    </div>
  );
}

export function CheckoutTextarea({
  id,
  label,
  error,
  hint,
  className,
  required,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & FieldExtras) {
  const messageId = messageIdFor(id, error, hint);
  return (
    <div className={className}>
      <div className="relative">
        <textarea
          id={id}
          placeholder=" "
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={messageId}
          className={cn(fieldBase, toneClass(error), "peer min-h-[7rem] resize-y pt-7 pb-2.5")}
          {...props}
        />
        <label
          htmlFor={id}
          className="pointer-events-none absolute left-4 top-2 text-xs font-semibold text-taupe peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:font-normal peer-focus:top-2 peer-focus:text-xs peer-focus:font-semibold"
        >
          <LabelText label={label} required={required} />
        </label>
      </div>
      <FieldMessage id={messageId} error={error} hint={hint} />
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
