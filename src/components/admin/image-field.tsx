"use client";

import { useEffect, useId, useRef, useState, type DragEvent } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";

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
   * When set (e.g. gallery slots), shows a top-right × that removes the slot.
   * Differs from clearing the image while keeping the control.
   */
  onRemoveSlot?: () => void;
  /** Open URL field by default when empty */
  defaultUrlOpen?: boolean;
};

/**
 * Admin media control: preview + drop zone, clear ×, and visible URL field.
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
  defaultUrlOpen = false,
}: Props) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [urlOpen, setUrlOpen] = useState(defaultUrlOpen);
  const [urlDraft, setUrlDraft] = useState(value);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [broken, setBroken] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    setUrlDraft(value);
    setBroken(false);
    if (value && !value.startsWith("blob:")) {
      setLocalPreview(null);
    }
  }, [value]);

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
    setError("");
    setUploading(true);
    setBroken(false);

    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);

    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body,
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error || "Upload failed");
        setLocalPreview(null);
        URL.revokeObjectURL(objectUrl);
        return;
      }
      onChange(json.data.url as string);
      setUrlDraft(json.data.url as string);
      setUrlOpen(false);
      URL.revokeObjectURL(objectUrl);
      setLocalPreview(null);
    } catch {
      setError("Network error while uploading");
      setLocalPreview(null);
      URL.revokeObjectURL(objectUrl);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function applyUrl() {
    const next = urlDraft.trim();
    setBroken(false);
    setError("");
    onChange(next);
    if (next) setUrlOpen(false);
  }

  function clearImage() {
    setLocalPreview(null);
    setUrlDraft("");
    setBroken(false);
    setError("");
    onChange("");
  }

  function handleRemoveClick() {
    if (onRemoveSlot) {
      onRemoveSlot();
      return;
    }
    clearImage();
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      void uploadFile(file);
    } else {
      setError("Drop an image file (JPG, PNG, or WebP)");
    }
  }

  return (
    <div className={cn("min-w-0", className)}>
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p
            className={cn(
              "font-display font-semibold text-[var(--admin-ink)]",
              compact ? "text-[13px]" : "text-sm",
            )}
          >
            {label}
          </p>
          {hint ? (
            <p className="mt-0.5 text-[13px] leading-snug text-[var(--admin-muted)]">
              {hint}
            </p>
          ) : null}
        </div>
      </div>

      <div
        className={cn(
          "relative overflow-hidden rounded-lg border bg-[var(--admin-soft-2)] transition-colors",
          dragging
            ? "border-brass bg-brass/5"
            : "border-[var(--admin-line)]",
          hasImage
            ? "border-solid"
            : "border-dashed border-[var(--admin-input-border)]",
        )}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragging(false);
        }}
        onDrop={onDrop}
      >
        {/* Always show remove × when we have content or a removable slot */}
        {hasImage || onRemoveSlot ? (
          <button
            type="button"
            onClick={handleRemoveClick}
            aria-label={onRemoveSlot ? "Remove image slot" : "Clear image"}
            title={onRemoveSlot ? "Remove" : "Clear image"}
            className="absolute right-2 top-2 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[var(--admin-line)] bg-[var(--admin-paper)] text-base leading-none text-[var(--admin-ink)] shadow-sm transition-colors hover:border-rosewood hover:bg-rosewood hover:text-white"
          >
            ×
          </button>
        ) : null}

        {hasImage ? (
          <div className={cn("relative bg-[var(--admin-soft)]", aspectClass)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewSrc}
              alt=""
              className="h-full w-full object-contain p-2"
              onError={() => setBroken(true)}
              onLoad={() => setBroken(false)}
            />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-gradient-to-t from-black/60 to-transparent px-3 pb-3 pt-10">
              <label
                htmlFor={inputId}
                className={cn(
                  "cursor-pointer rounded-md bg-white px-3 py-1.5 font-display text-xs font-semibold uppercase tracking-wide text-ink shadow-sm transition-opacity hover:bg-white",
                  uploading && "pointer-events-none opacity-60",
                )}
              >
                {uploading ? "Uploading…" : "Replace"}
              </label>
              <button
                type="button"
                onClick={() => setUrlOpen((v) => !v)}
                className="cursor-pointer rounded-md border border-white/50 bg-black/40 px-3 py-1.5 font-display text-xs font-semibold uppercase tracking-wide text-white backdrop-blur-sm transition-colors hover:bg-black/55"
              >
                URL
              </button>
            </div>
            <input
              id={inputId}
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadFile(f);
              }}
            />
          </div>
        ) : (
          <label
            htmlFor={inputId}
            className={cn(
              "flex w-full cursor-pointer flex-col items-center justify-center gap-2 px-4 text-center transition-colors hover:bg-[var(--admin-soft)]",
              aspectClass,
              compact ? "min-h-[8rem]" : "min-h-[10rem]",
              uploading && "pointer-events-none opacity-60",
            )}
          >
            <span
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border border-[var(--admin-line)] bg-[var(--admin-paper)] text-xl leading-none text-[var(--admin-muted)]",
                compact && "h-9 w-9 text-lg",
              )}
              aria-hidden
            >
              +
            </span>
            <span className="font-display text-[15px] font-medium text-[var(--admin-ink)]">
              {uploading ? "Uploading…" : "Drop image or click"}
            </span>
            <span className="text-[13px] text-[var(--admin-muted)]">
              JPG, PNG, WebP
            </span>
            <input
              id={inputId}
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadFile(f);
              }}
            />
          </label>
        )}
      </div>

      {/* URL row — always available and styled for contrast */}
      <div className="mt-3 rounded-md border border-[var(--admin-line)] bg-[var(--admin-paper)] p-2.5">
        {!urlOpen && !hasImage ? (
          <button
            type="button"
            onClick={() => setUrlOpen(true)}
            className="w-full cursor-pointer py-1 text-left font-display text-sm font-medium text-[var(--admin-ink)] underline-offset-2 hover:underline"
          >
            Or paste an image URL
          </button>
        ) : null}
        {urlOpen || hasImage ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="url"
              inputMode="url"
              placeholder="https://… or /products/photo.webp"
              value={urlDraft}
              onChange={(e) => {
                setUrlDraft(e.target.value);
                setBroken(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  applyUrl();
                }
              }}
              className="min-h-11 min-w-0 flex-1 rounded-md border border-[var(--admin-input-border)] bg-[var(--admin-soft-2)] px-3 py-2.5 text-[15px] text-[var(--admin-ink)] outline-none placeholder:text-[var(--admin-faint)] focus:border-brass focus:ring-2 focus:ring-brass/20"
            />
            <div className="flex shrink-0 gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={applyUrl}
                className="!h-11 !min-h-11 !w-auto !px-4 text-sm"
              >
                Apply URL
              </Button>
              {!hasImage ? (
                <button
                  type="button"
                  onClick={() => {
                    setUrlOpen(false);
                    setUrlDraft(value);
                  }}
                  className="cursor-pointer px-2 font-display text-sm text-[var(--admin-muted)] hover:text-[var(--admin-ink)]"
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="mt-2 text-sm font-medium text-rosewood">{error}</p>
      ) : null}
      {broken && value ? (
        <p className="mt-2 text-sm text-rosewood">Could not load this image</p>
      ) : null}
    </div>
  );
}
