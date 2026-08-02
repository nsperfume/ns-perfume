"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";

type Mode = "upload" | "link";

type Props = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
  className?: string;
};

/**
 * Admin media control: upload a file (Cloudinary) or paste an image URL.
 * Live preview updates for both paths.
 */
export function AdminImageField({
  label,
  value,
  onChange,
  hint,
  className,
}: Props) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>(value ? "link" : "upload");
  const [urlDraft, setUrlDraft] = useState(value);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [broken, setBroken] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  useEffect(() => {
    setUrlDraft(value);
    setBroken(false);
    if (value && !value.startsWith("blob:")) {
      setLocalPreview(null);
    }
  }, [value]);

  const previewSrc = localPreview || value;

  async function uploadFile(file: File) {
    setError("");
    setUploading(true);
    setBroken(false);

    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!json.ok) {
        setError(
          json.error ||
            "Upload failed. You can still paste an image URL instead.",
        );
        setLocalPreview(null);
        URL.revokeObjectURL(objectUrl);
        return;
      }
      onChange(json.data.url as string);
      setUrlDraft(json.data.url as string);
      setMode("link");
    } catch {
      setError("Upload network error. Paste a public image URL if needed.");
      setLocalPreview(null);
    } finally {
      setUploading(false);
      URL.revokeObjectURL(objectUrl);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function applyUrl() {
    const next = urlDraft.trim();
    setError("");
    setBroken(false);
    setLocalPreview(null);
    onChange(next);
  }

  function clearImage() {
    setError("");
    setBroken(false);
    setLocalPreview(null);
    setUrlDraft("");
    onChange("");
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-[#e1e3e5] bg-[#fafafa] p-4",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#202223]">{label}</p>
          {hint ? (
            <p className="mt-0.5 text-xs text-[#6d7175]">{hint}</p>
          ) : null}
        </div>
        {previewSrc ? (
          <button
            type="button"
            onClick={clearImage}
            className="shrink-0 text-xs font-medium text-[#8B4A45] hover:underline"
          >
            Remove
          </button>
        ) : null}
      </div>

      {/* Preview */}
      <div className="mt-3 flex aspect-square w-full max-w-[220px] items-center justify-center overflow-hidden rounded-lg border border-dashed border-[#c9cccf] bg-white">
        {previewSrc && !broken ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewSrc}
            alt={`${label} preview`}
            className="h-full w-full object-contain p-3"
            onError={() => setBroken(true)}
            onLoad={() => setBroken(false)}
          />
        ) : (
          <p className="px-4 text-center text-xs text-[#6d7175]">
            {broken
              ? "Could not load this image. Check the URL."
              : "No image yet"}
          </p>
        )}
      </div>

      {/* Mode switch */}
      <div className="mt-3 inline-flex rounded-lg border border-[#c9cccf] bg-white p-0.5 text-xs font-medium">
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={cn(
            "rounded-md px-3 py-1.5 transition-colors",
            mode === "upload"
              ? "bg-[#1a1a1a] text-white"
              : "text-[#4a4a4a] hover:bg-[#f1f2f3]",
          )}
        >
          Upload file
        </button>
        <button
          type="button"
          onClick={() => setMode("link")}
          className={cn(
            "rounded-md px-3 py-1.5 transition-colors",
            mode === "link"
              ? "bg-[#1a1a1a] text-white"
              : "text-[#4a4a4a] hover:bg-[#f1f2f3]",
          )}
        >
          Image link
        </button>
      </div>

      {mode === "upload" ? (
        <div className="mt-3">
          <label
            htmlFor={inputId}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[#c9cccf] bg-white px-4 py-6 text-center transition-colors hover:border-[#A9873C] hover:bg-[#fffdf8]",
              uploading && "pointer-events-none opacity-60",
            )}
          >
            <span className="text-sm font-medium text-[#202223]">
              {uploading ? "Uploading…" : "Choose image"}
            </span>
            <span className="mt-1 text-xs text-[#6d7175]">
              JPG, PNG, WebP · sent to Cloudinary when configured
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
          <p className="mt-2 text-[11px] text-[#6d7175]">
            Prefer a URL only? Switch to{" "}
            <button
              type="button"
              className="font-medium text-[#005bd3] underline-offset-2 hover:underline"
              onClick={() => setMode("link")}
            >
              Image link
            </button>
            .
          </p>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <label className="block text-xs font-medium text-[#303030]">
            Image URL
            <input
              type="url"
              inputMode="url"
              placeholder="https://… or /products/your-file.webp"
              className="mt-1 w-full rounded-lg border border-[#c9cccf] bg-white px-3 py-2 text-sm outline-none focus:border-[#A9873C]"
              value={urlDraft}
              onChange={(e) => {
                setUrlDraft(e.target.value);
                setBroken(false);
              }}
              onBlur={applyUrl}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  applyUrl();
                }
              }}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={applyUrl}
              className="rounded-lg bg-[#1a1a1a] px-3 py-1.5 text-xs font-medium text-white"
            >
              Apply & preview
            </button>
            {urlDraft.trim() && urlDraft !== value ? (
              <span className="self-center text-[11px] text-[#6d7175]">
                Unsaved draft — click Apply
              </span>
            ) : null}
          </div>
          <p className="text-[11px] text-[#6d7175]">
            Paste a full CDN URL, Unsplash link, or a path under{" "}
            <code className="rounded bg-white px-1">/public</code> (e.g.{" "}
            <code className="rounded bg-white px-1">/products/amber.webp</code>
            ).
          </p>
        </div>
      )}

      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
      {uploading ? (
        <p className="mt-2 text-xs text-[#6d7175]">Uploading to Cloudinary…</p>
      ) : null}
      {value && !broken ? (
        <p className="mt-2 truncate font-mono text-[10px] text-[#6d7175]" title={value}>
          {value}
        </p>
      ) : null}
    </div>
  );
}
