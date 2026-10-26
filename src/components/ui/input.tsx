import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type FieldExtras = {
  label?: string;
  error?: string;
  /** Helper line under the field, replaced by the error when there is one. */
  hint?: ReactNode;
};

type InputProps = InputHTMLAttributes<HTMLInputElement> & FieldExtras;

const fieldClass =
  "w-full rounded-xs border border-[#d6cfbf] bg-paper px-4 py-3 font-sans text-base text-ink outline-none transition-colors placeholder:text-[#8a8f99] hover:border-ink/40 focus:border-brass focus:ring-2 focus:ring-brass/25";
const errorClass = "border-rosewood focus:border-rosewood focus:ring-rosewood/20";

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <span className="text-ink/80">
      {label}
      {required ? (
        <span aria-hidden="true" className="ml-0.5 text-rosewood">
          *
        </span>
      ) : null}
    </span>
  );
}

function FieldMessage({ id, error, hint }: { id?: string; error?: string; hint?: ReactNode }) {
  if (error) {
    return (
      <span id={id} className="text-sm font-medium text-rosewood">
        {error}
      </span>
    );
  }
  if (hint) {
    return (
      <span id={id} className="text-sm font-normal text-taupe">
        {hint}
      </span>
    );
  }
  return null;
}

export function Input({ label, error, hint, className, id, ...props }: InputProps) {
  const inputId = id || props.name;
  const messageId = inputId && (error || hint) ? `${inputId}-message` : undefined;
  return (
    <label
      className={
        label ? "flex flex-col gap-2 text-sm font-semibold text-taupe" : "contents"
      }
    >
      {label ? <FieldLabel label={label} required={props.required} /> : null}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={messageId}
        className={cn("min-h-12", fieldClass, error && errorClass, className)}
        {...props}
      />
      <FieldMessage id={messageId} error={error} hint={hint} />
    </label>
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & FieldExtras;

export function Textarea({
  label,
  error,
  hint,
  className,
  id,
  ...props
}: TextareaProps) {
  const inputId = id || props.name;
  const messageId = inputId && (error || hint) ? `${inputId}-message` : undefined;
  return (
    <label
      className={
        label ? "flex flex-col gap-2 text-sm font-semibold text-taupe" : "contents"
      }
    >
      {label ? <FieldLabel label={label} required={props.required} /> : null}
      <textarea
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={messageId}
        className={cn("min-h-[7.5rem] resize-y leading-relaxed", fieldClass, error && errorClass, className)}
        {...props}
      />
      <FieldMessage id={messageId} error={error} hint={hint} />
    </label>
  );
}
