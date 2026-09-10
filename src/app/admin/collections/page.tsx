"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminImageField } from "@/components/admin/image-field";
import { AdminRichTextEditor } from "@/components/admin/rich-text-editor";
import {
  AdminFieldLabel,
  AdminFormSection,
  adminFieldClass,
} from "@/components/admin/form-section";
import {
  AdminPageHeader,
  AdminStatusBadge,
  AdminTable,
  AdminTd,
  AdminTh,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";
import { richTextToPlain, sanitizeRichHtml, toRichHtml } from "@/lib/rich-text";

type Collection = {
  _id: string;
  handle: string;
  title: string;
  description?: string;
  status?: string;
  bannerImage?: string;
};

const formSchema = z.object({
  title: z.string().trim().min(2, "Title needs at least 2 characters"),
  handle: z
    .string()
    .trim()
    .min(2, "Handle needs at least 2 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers, hyphens",
    ),
  description: z.string().optional(),
  bannerImage: z
    .string()
    .trim()
    .refine(
      (v) =>
        !v ||
        v.startsWith("/") ||
        v.startsWith("http://") ||
        v.startsWith("https://"),
      "Use a full URL or a site path starting with /",
    )
    .optional(),
  status: z.enum(["active", "draft"]),
});

export default function AdminCollectionsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(
    null,
  );
  const [items, setItems] = useState<Collection[]>([]);
  const [title, setTitle] = useState("");
  const [handle, setHandle] = useState("");
  const [description, setDescription] = useState("");
  const [bannerImage, setBannerImage] = useState("");
  const [status, setStatus] = useState<"active" | "draft">("draft");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(true);

  function load() {
    fetch("/api/collections?all=1")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setItems(j.data);
      });
  }

  useEffect(() => {
    fetch("/api/admin/auth")
      .then((r) => r.json())
      .then((j) => {
        if (!j.ok) router.replace("/admin/login");
        else setUser(j.data);
      });
    load();
  }, [router]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setErrors({});
    const plainDescription = richTextToPlain(description);
    if (plainDescription.length > 500) {
      setErrors({ description: "Keep under 500 characters" });
      return;
    }
    const parsed = formSchema.safeParse({
      title,
      handle,
      description: sanitizeRichHtml(toRichHtml(description)),
      bannerImage,
      status,
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] || "form");
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json = await res.json();
      if (!json.ok) {
        setFormError(json.error || "Could not create collection");
        return;
      }
      setTitle("");
      setHandle("");
      setDescription("");
      setBannerImage("");
      setStatus("draft");
      load();
    } catch {
      setFormError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell user={user}>
      <AdminPageHeader
        title="Collections"
        description="Group bottles for shop navigation. Draft stays off the storefront."
        action={
          <Button
            type="button"
            variant={showForm ? "secondary" : "primary"}
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? "Hide form" : "New collection"}
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:items-start">
        {/* List — left */}
        <div className="min-w-0">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-display text-base font-medium text-admin-ink">
              All collections
              <span className="ml-2 text-sm font-normal text-admin-muted">
                {items.length}
              </span>
            </h2>
            <Tooltip content="Product membership is driven by tags and filters on each collection.">
              <button
                type="button"
                className="cursor-help font-display text-xs text-admin-muted underline-offset-2 hover:underline"
              >
                How linking works
              </button>
            </Tooltip>
          </div>
          <AdminTable>
            <thead>
              <tr>
                <AdminTh>Collection</AdminTh>
                <AdminTh>Handle</AdminTh>
                <AdminTh>Status</AdminTh>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.handle} className="hover:bg-admin-soft">
                  <AdminTd>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-admin-line bg-admin-soft">
                        {c.bannerImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={c.bannerImage}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div>
                        <p className="font-semibold text-admin-ink">
                          {c.title}
                        </p>
                        {c.description ? (
                          <p className="line-clamp-1 text-xs text-admin-muted">
                            {richTextToPlain(c.description)}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </AdminTd>
                  <AdminTd>
                    <span className="font-mono text-xs text-admin-muted">
                      {c.handle}
                    </span>
                  </AdminTd>
                  <AdminTd>
                    <AdminStatusBadge status={c.status || "active"} />
                  </AdminTd>
                </tr>
              ))}
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-14 text-center text-admin-muted"
                  >
                    No collections yet. Use the form on the right to create one.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </AdminTable>
        </div>

        {/* Form — right */}
        {showForm ? (
          <form
            onSubmit={create}
            className="min-w-0 space-y-4 lg:sticky lg:top-4"
            noValidate
          >
            <AdminFormSection
              title="Name and URL"
              description="Title customers see. Handle is the collection URL."
              tip="Handle becomes /collections/your-handle. Prefer simple slugs like for-him."
            >
              <div>
                <AdminFieldLabel tip="Display name in navigation and headers." required>
                  Title
                </AdminFieldLabel>
                <input
                  className={cn(
                    adminFieldClass,
                    errors.title && "border-rosewood",
                  )}
                  required
                  value={title}
                  onChange={(e) => {
                    const v = e.target.value;
                    setTitle(v);
                    setHandle(
                      v
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/^-|-$/g, ""),
                    );
                  }}
                  placeholder="For him"
                />
                {errors.title ? (
                  <p className="mt-1 text-sm text-rosewood">{errors.title}</p>
                ) : null}
              </div>
              <div>
                <AdminFieldLabel
                  tip="Lowercase letters, numbers, hyphens only."
                  required
                >
                  Handle
                </AdminFieldLabel>
                <input
                  className={cn(
                    adminFieldClass,
                    errors.handle && "border-rosewood",
                  )}
                  required
                  value={handle}
                  onChange={(e) =>
                    setHandle(
                      e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                    )
                  }
                  placeholder="for-him"
                />
                {errors.handle ? (
                  <p className="mt-1 text-sm text-rosewood">{errors.handle}</p>
                ) : null}
                {handle ? (
                  <p className="mt-1 font-mono text-xs text-admin-faint">
                    /collections/{handle}
                  </p>
                ) : null}
              </div>
            </AdminFormSection>

            <AdminFormSection
              title="Copy and status"
              tip="Draft hides the collection from shop menus until you publish."
            >
              <div>
                <AdminRichTextEditor
                  label="Description"
                  tip="Short intro under the collection title. Optional."
                  value={description}
                  error={errors.description}
                  minHeightClass="min-h-28"
                  placeholder="Cedar, vetiver, and leather for daytime and desk."
                  onChange={setDescription}
                />
              </div>
              <Select
                label="Status"
                value={status}
                onValueChange={(v) => setStatus(v as "active" | "draft")}
                options={[
                  { value: "draft", label: "Draft (hidden)" },
                  { value: "active", label: "Published" },
                ]}
              />
            </AdminFormSection>

            <AdminFormSection
              title="Banner image"
              description="Shown on collection cards and header where used."
              tip="Drop a file, click to upload, or paste a URL."
            >
              <AdminImageField
                label="Collection image"
                value={bannerImage}
                onChange={setBannerImage}
                hint="Wide or square both work"
                aspect="wide"
              />
              {errors.bannerImage ? (
                <p className="text-sm text-rosewood">{errors.bannerImage}</p>
              ) : null}
            </AdminFormSection>

            {formError ? (
              <p className="text-sm font-medium text-rosewood">{formError}</p>
            ) : null}
            <Button type="submit" disabled={saving} className="w-full">
              {saving ? "Creating…" : "Create collection"}
            </Button>
          </form>
        ) : (
          <div className="rounded-lg border border-dashed border-admin-line bg-admin-paper px-5 py-10 text-center lg:sticky lg:top-4">
            <p className="text-sm text-admin-muted">
              Form hidden. Open it to create a collection.
            </p>
            <Button
              type="button"
              className="mt-4"
              onClick={() => setShowForm(true)}
            >
              New collection
            </Button>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
