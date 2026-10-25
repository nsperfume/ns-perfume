"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type DragEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/admin/button";
import { AdminIcon } from "@/components/admin/ui";
import { AdminFieldError } from "@/components/admin/form-validation";
import { toast } from "@/components/admin/toast";

type Props = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
  className?: string;
  /** compact for tight grids / galleries */
  density?: "default" | "compact";
  /** Preview frame shape */
  aspect?: "square" | "portrait" | "wide";
  /**
   * When set (e.g. gallery slots), "Remove" drops the whole slot instead of
   * only clearing the image.
   */
  onRemoveSlot?: () => void;
  /** @deprecated URL entry was removed (upload only). Ignored. */
  defaultUrlOpen?: boolean;
  /** Validation message from the parent form */
  error?: string;
  required?: boolean;
  /** Field key for validation focus */
  name?: string;
  /** Extra actions next to Replace / Remove (e.g. "Make main") */
  actions?: ReactNode;
  /** Hide the label row (e.g. the label is rendered by the parent) */
  hideLabel?: boolean;
};

/* Mirrors /api/admin/upload: magic-byte checked JPG, PNG, WebP, AVIF up to 8 MB. */
const MAX_BYTES = 8 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const ALLOWED_EXT = /\.(jpe?g|png|webp|avif)$/i;
const TYPE_ERROR = "Use a JPG, PNG, WebP or AVIF image.";

function checkFile(file: File): string | null {
  const typeOk = file.type
    ? ALLOWED_TYPES.has(file.type)
    : ALLOWED_EXT.test(file.name);
  if (!typeOk) return TYPE_ERROR;
  if (file.size > MAX_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    return `This image is ${mb} MB. The limit is 8 MB.`;
  }
  return null;
}

/** Upload with progress (fetch has no upload progress events). */
function uploadWithProgress(
  file: File,
  onProgress: (pct: number) => void,
): Promise<{ ok: boolean; url?: string; error?: string; status: number }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/upload");
    xhr.responseType = "json";
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      const body = (xhr.response || null) as {
        ok?: boolean;
        data?: { url?: string };
        error?: string;
      } | null;
      if (body?.ok && body.data?.url) {
        resolve({ ok: true, url: body.data.url, status: xhr.status });
      } else {
        resolve({ ok: false, error: body?.error, status: xhr.status });
      }
    };
    xhr.onerror = () => resolve({ ok: false, status: 0 });
    const form = new FormData();
    form.append("file", file);
    xhr.send(form);
  });
}

/** Plain-language message for an upload failure (no server/env details). */
function friendlyUploadError(status: number, serverMessage?: string) {
  if (status === 0) return "Upload failed. Check your connection and try again.";
  if (status === 401 || status === 403) return "Your session ended. Sign in again to upload.";
  if (status === 413) return "This image is too large. The limit is 8 MB.";
  if (status === 503) return "Image uploads are not set up yet. Ask your site admin to turn them on.";
  if (status === 400 && serverMessage) return serverMessage.endsWith(".") ? serverMessage : `${serverMessage}.`;
  return "Upload failed. Try again.";
}

function UploadGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 15V4M7.5 8.5 12 4l4.5 4.5" />
      <path d="M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15" />
    </svg>
  );
}

/**
 * Admin image control: drag and drop or browse, preview, replace, remove,
 * upload progress. Upload only (no URL entry).
 */
export function AdminImageField({
  label,
  value,
  onChange,
  hint,
  className,
  density = "default",
  aspect = "square",
  onRemoveSlot,
  error: fieldError,
  required,
  name,
  actions,
  hideLabel,
}: Props) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [broken, setBroken] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    setBroken(false);
  }, [value]);

  const uploading = progress !== null;
  const previewSrc = localPreview || value;
  const hasImage = Boolean(previewSrc) && !broken;
  const compact = density === "compact";

  const aspectClass =
    aspect === "wide"
      ? "aspect-[16/10]"
      : aspect === "portrait"
        ? "aspect-[4/5]"
        : "aspect-square";

  async function uploadFile(file: File) {
    const problem = checkFile(file);
    if (problem) {
      setError(problem);
      toast.error(problem);
      return;
    }
    setError("");
    setBroken(false);
    setProgress(0);
    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);

    const res = await uploadWithProgress(file, setProgress);
    URL.revokeObjectURL(objectUrl);
    setLocalPreview(null);
    setProgress(null);
    if (fileRef.current) fileRef.current.value = "";

    if (res.ok && res.url) {
      onChange(res.url);
      toast.success("Image uploaded");
    } else {
      const message = friendlyUploadError(res.status, res.error);
      setError(message);
      toast.error(message);
    }
  }

  function clearImage() {
    setLocalPreview(null);
    setBroken(false);
    setError("");
    onChange("");
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (uploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) void uploadFile(file);
  }

  const dragProps = {
    onDragEnter: (e: DragEvent) => {
      e.preventDefault();
      if (!uploading) setDragging(true);
    },
    onDragOver: (e: DragEvent) => {
      e.preventDefault();
      if (!uploading) setDragging(true);
    },
    onDragLeave: (e: DragEvent) => {
      e.preventDefault();
      setDragging(false);
    },
    onDrop,
  };

  const shownError = error || fieldError;

  return (
    <div className={cn("min-w-0", className)} data-field={name}>
      {!hideLabel ? (
        <div className="mb-2 min-w-0">
          <p className="text-sm font-semibold text-admin-ink">
            {label}
            {required ? (
              <span className="text-admin-danger" aria-hidden>
                {" "}
                *
              </span>
            ) : null}
          </p>
          {hint ? (
            <p className="mt-0.5 text-[0.8125rem] leading-snug text-admin-muted">
              {hint}
            </p>
          ) : null}
        </div>
      ) : null}

      {hasImage ? (
        <div
          className={cn(
            "overflow-hidden rounded-lg border bg-admin-paper transition-colors",
            dragging ? "border-brass ring-2 ring-brass/20" : "border-admin-line",
            shownError && "border-admin-danger",
          )}
          {...dragProps}
        >
          <div className={cn("relative bg-admin-soft-2", aspectClass)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewSrc}
              alt={label}
              className={cn(
                "h-full w-full object-contain p-2 transition-opacity",
                uploading && "opacity-50",
              )}
              onError={() => setBroken(true)}
              onLoad={() => setBroken(false)}
            />
            {uploading ? (
              <div className="absolute inset-x-3 bottom-3 rounded-md bg-admin-paper/95 px-3 py-2 shadow-admin">
                <div className="flex items-center justify-between text-[0.8125rem] font-semibold text-admin-ink">
                  <span>Uploading</span>
                  <span className="font-mono tabular-nums">{progress}%</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-admin-soft">
                  <div
                    className="h-full rounded-full bg-brass transition-[width]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 border-t border-admin-line px-2 py-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="w-auto! [&>span:last-child]:px-3!"
            >
              <AdminIcon name="upload" size={16} />
              Replace
            </Button>
            {actions}
            <Button
              type="button"
              variant="ghost"
              disabled={uploading}
              onClick={onRemoveSlot ?? clearImage}
              className="ml-auto no-underline! text-admin-muted! hover:bg-(--admin-tone-rose-bg)! hover:text-admin-danger!"
            >
              <AdminIcon name="delete" size={16} />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileRef.current?.click();
            }
          }}
          className={cn(
            "flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 text-center outline-none transition-colors",
            "focus-visible:border-brass focus-visible:ring-2 focus-visible:ring-brass/25",
            aspectClass,
            compact ? "min-h-[9rem]" : "min-h-[11rem]",
            dragging
              ? "border-brass bg-brass/5"
              : shownError
                ? "border-admin-danger bg-admin-soft-2"
                : "border-admin-input-border bg-admin-soft-2 hover:border-admin-faint hover:bg-admin-soft",
            uploading && "pointer-events-none",
          )}
          {...dragProps}
        >
          {uploading ? (
            <span className="w-full max-w-[14rem]">
              <span className="flex items-center justify-between text-[0.8125rem] font-semibold text-admin-ink">
                <span>Uploading</span>
                <span className="font-mono tabular-nums">{progress}%</span>
              </span>
              <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-admin-soft">
                <span
                  className="block h-full rounded-full bg-brass transition-[width]"
                  style={{ width: `${progress}%` }}
                />
              </span>
            </span>
          ) : (
            <>
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full border border-admin-line bg-admin-paper text-admin-muted"
                aria-hidden
              >
                <UploadGlyph className="h-5 w-5" />
              </span>
              <span className="text-[0.9375rem] font-semibold text-admin-ink">
                {compact ? "Add image" : "Drag an image here"}
              </span>
              <span className="text-[0.8125rem] text-admin-muted">
                {compact ? "Drop or browse" : "or "}
                {compact ? null : (
                  <span className="font-semibold text-admin-accent underline underline-offset-2">
                    browse files
                  </span>
                )}
              </span>
              <span className="text-xs text-admin-muted">
                JPG, PNG, WebP or AVIF, up to 8 MB
              </span>
            </>
          )}
        </label>
      )}

      {broken && value && !uploading ? (
        <div className="flex items-start justify-between gap-2">
          <AdminFieldError message="This image could not be loaded. Upload it again." />
          <button
            type="button"
            onClick={onRemoveSlot ?? clearImage}
            className="mt-1 min-h-8 shrink-0 cursor-pointer rounded-md px-2 text-sm font-semibold text-admin-muted hover:bg-admin-soft hover:text-admin-danger"
          >
            Remove
          </button>
        </div>
      ) : null}
      <AdminFieldError message={shownError} />
      <input
        id={inputId}
        ref={fileRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        tabIndex={-1}
        disabled={uploading}
        aria-label={`Upload ${label}`}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void uploadFile(f);
        }}
      />
    </div>
  );
}
