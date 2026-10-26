"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { AdminFieldLabel } from "@/components/admin/form-section";
import { AdminFieldError } from "@/components/admin/form-validation";
import { Button } from "@/components/admin/button";
import { adminFieldClass } from "@/components/admin/form-section";
import { cn } from "@/lib/cn";
import { Tooltip } from "@/components/ui/tooltip";
import { sanitizeRichHtml } from "@/lib/rich-text";

type Props = {
  label: string;
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  tip?: string;
  error?: string;
  required?: boolean;
  className?: string;
  /** Tailwind min-height for the editing surface */
  minHeightClass?: string;
  /** Field key for validation focus */
  name?: string;
  onBlur?: () => void;
};

function ToolbarButton({
  active,
  disabled,
  onClick,
  label,
  wide,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
  /** Text button (e.g. "Heading") instead of a 36px icon square */
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <Tooltip content={label}>
    <button
      type="button"
      aria-label={label}
      aria-pressed={active ? true : undefined}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 cursor-pointer items-center justify-center rounded-md transition-colors",
        wide ? "px-2.5" : "w-9",
        active
          ? "bg-admin-ink text-admin-paper"
          : "text-admin-muted hover:bg-admin-soft hover:text-admin-ink",
        disabled && "cursor-not-allowed opacity-40",
      )}
    >
      {children}
    </button>
    </Tooltip>
  );
}

function IconBold() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 5h6a3.5 3.5 0 0 1 0 7H7V5Zm0 7h7a3.5 3.5 0 0 1 0 7H7v-7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconItalic() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14 5h-5M15 19H10M12.5 5 9.5 19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
function IconUnderline() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 5v6a5 5 0 0 0 10 0V5M6 19h12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
function TextHeading() {
  return <span className="text-[0.875rem] font-bold leading-none">Heading</span>;
}
function TextSubheading() {
  return <span className="text-[0.8125rem] font-semibold leading-none">Subheading</span>;
}
function IconList() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
function IconOrdered() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M11 6h10M11 12h10M11 18h10M4 6h1v4M4 10h2M5 14l-1 4h3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconQuote() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 17a4 4 0 0 1-4-4V8h5v5H7a2 2 0 0 0 2 2v2Zm10 0a4 4 0 0 1-4-4V8h5v5h-2a2 2 0 0 0 2 2v2Z"
        fill="currentColor"
      />
    </svg>
  );
}
function IconLink() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M10 14a5 5 0 0 0 7.07 0l2.12-2.12a5 5 0 0 0-7.07-7.07L11 5.93M14 10a5 5 0 0 0-7.07 0L4.81 12.12a5 5 0 0 0 7.07 7.07L13 18.07"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
function IconSeparator() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 12h16M8 7v2M16 7v2M8 15v2M16 15v2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
/** Eraser: clear formatting (not the bin, which means delete). */
function IconClear() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 21h13M5.6 15.4l8.5-8.5a2 2 0 0 1 2.8 0l2.2 2.2a2 2 0 0 1 0 2.8L12.4 18.6a2 2 0 0 1-1.4.6H8.2a2 2 0 0 1-1.4-.6l-1.2-1.2a1.4 1.4 0 0 1 0-2zM9.5 11.5l5 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Turn what the owner types into a link the store can use: web addresses
 * (https:// is added when missing), email addresses, or store pages ("/shop").
 * Returns null when it is not a usable link.
 */
function normalizeLink(raw: string): string | null {
  const v = raw.trim();
  if (!v || /\s/.test(v)) return null;
  if (v.startsWith("/") && !v.startsWith("//")) return v;
  if (/^mailto:[^@\s]+@[^@\s]+\.[^@\s]+$/i.test(v)) return v;
  if (/^[^@\s/:]+@[^@\s/]+\.[^@\s/]+$/.test(v)) return `mailto:${v}`;
  const withScheme = /^https?:\/\//i.test(v) ? v : /^[a-z][a-z0-9+.-]*:(?!\d)/i.test(v) ? null : `https://${v.replace(/^\/+/, "")}`;
  if (!withScheme) return null;
  try {
    const u = new URL(withScheme);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    if (!/^[^.]+(\.[^.]+)+$/.test(u.hostname)) return null;
    return withScheme;
  } catch {
    return null;
  }
}

/** Small in-app dialog for adding, changing or removing a link. */
function LinkDialog({
  open,
  initial,
  editing,
  onClose,
  onApply,
  onRemove,
  onAfterClose,
}: {
  open: boolean;
  initial: string;
  /** The cursor is on an existing link */
  editing: boolean;
  onClose: () => void;
  onApply: (href: string) => void;
  onRemove: () => void;
  /** Runs once the dialog has let go of focus, so the editor can take it back. */
  onAfterClose: () => void;
}) {
  const inputId = useId();
  const [value, setValue] = useState(initial);
  const [error, setError] = useState("");
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setContainer(document.querySelector<HTMLElement>(".admin-app"));
  }, []);

  useEffect(() => {
    if (!open) return;
    setValue(initial);
    setError("");
  }, [open, initial]);

  function apply() {
    if (!value.trim()) {
      setError("Enter a web address");
      return;
    }
    const href = normalizeLink(value);
    if (!href) {
      setError("Enter a web address like nsperfume.pk/shop, or an email address");
      return;
    }
    onApply(href);
  }

  return (
    <AlertDialog.Root open={open} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <AlertDialog.Portal container={container ?? undefined}>
        <AlertDialog.Overlay className="fixed inset-0 z-100 bg-black/45 backdrop-blur-[1px]" />
        <AlertDialog.Content
          className="fixed left-1/2 top-1/2 z-101 w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-admin-line bg-admin-paper p-6 text-admin-ink shadow-modal outline-none"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            const el = document.getElementById(inputId) as HTMLInputElement | null;
            el?.focus();
            el?.select();
          }}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            onAfterClose();
          }}
        >
          <AlertDialog.Title className="text-lg font-semibold text-admin-ink">
            {editing ? "Edit link" : "Add link"}
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-1.5 text-[0.9375rem] leading-relaxed text-admin-muted">
            Paste a web address or an email address. The selected words become the link.
          </AlertDialog.Description>
          <div className="mt-5">
            <AdminFieldLabel htmlFor={inputId} required>
              Web address
            </AdminFieldLabel>
            <input
              id={inputId}
              className={adminFieldClass}
              value={value}
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              placeholder="nsperfume.pk/shop"
              aria-invalid={error ? true : undefined}
              onChange={(e) => {
                setValue(e.target.value);
                if (error) setError("");
              }}
              onKeyDown={(e) => {
                // No <form> here: this dialog can sit inside a product form.
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.stopPropagation();
                  apply();
                }
              }}
            />
            <AdminFieldError message={error} />
          </div>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
            {editing ? (
              <Button
                type="button"
                variant="danger-outline"
                size="sm"
                className="sm:mr-auto sm:w-auto"
                onClick={onRemove}
              >
                Remove link
              </Button>
            ) : null}
            <div className="flex flex-col-reverse gap-2 sm:ml-auto sm:flex-row">
              <AlertDialog.Cancel asChild>
                <Button type="button" variant="secondary" size="sm" className="sm:w-auto">
                  Cancel
                </Button>
              </AlertDialog.Cancel>
              <Button type="button" size="sm" className="sm:w-auto" onClick={apply}>
                {editing ? "Save link" : "Add link"}
              </Button>
            </div>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

/**
 * TipTap rich text editor for admin descriptive copy.
 */
export function AdminRichTextEditor({
  label,
  value,
  onChange,
  placeholder = "Write clearly. Keep paragraphs short.",
  tip,
  error,
  required,
  className,
  minHeightClass = "min-h-52",
  name,
  onBlur,
}: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        // TipTap v3 StarterKit already ships link + underline.
        // Disable them here so the dedicated extensions below are not duplicated.
        link: false,
        underline: false,
      }),
      Underline,
      Placeholder.configure({ placeholder }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: cn(
          // Console UI type (the storefront renders this copy in its own faces)
          "admin-rich-editor prose-ns max-w-none px-3.5 py-3 text-base text-admin-ink outline-none font-sans! [&_h2]:font-sans! [&_h3]:font-sans! [&_h4]:font-sans!",
          minHeightClass,
        ),
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(sanitizeRichHtml(ed.getHTML()));
    },
    onBlur: () => {
      onBlur?.();
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const next = value || "";
    if (sanitizeRichHtml(current) !== sanitizeRichHtml(next)) {
      editor.commands.setContent(next || "", { emitUpdate: false });
    }
  }, [editor, value]);

  const [linkDialog, setLinkDialog] = useState<{ href: string; editing: boolean } | null>(
    null,
  );

  function openLinkDialog() {
    if (!editor) return;
    const previous = (editor.getAttributes("link").href as string | undefined) || "";
    setLinkDialog({ href: previous, editing: Boolean(previous) });
  }

  // Editor changes wait until the dialog has closed and released focus.
  const afterLinkDialog = useRef<(() => void) | null>(null);

  function closeLinkDialog(then: () => void) {
    afterLinkDialog.current = then;
    setLinkDialog(null);
  }

  function applyLink(href: string) {
    closeLinkDialog(() => {
      if (!editor) return;
      const chain = editor.chain().focus().extendMarkRange("link");
      if (editor.state.selection.empty && !editor.isActive("link")) {
        // Nothing selected: insert the address itself as the link text.
        const text = href.replace(/^mailto:/i, "");
        chain
          .insertContent({ type: "text", text, marks: [{ type: "link", attrs: { href } }] })
          .run();
        return;
      }
      chain.setLink({ href }).run();
    });
  }

  function removeLink() {
    closeLinkDialog(() => {
      editor?.chain().focus().extendMarkRange("link").unsetLink().run();
    });
  }

  return (
    <div className={cn("block", className)} data-field={name}>
      <AdminFieldLabel tip={tip} required={required}>
        {label}
      </AdminFieldLabel>
      <div
        className={cn(
          "admin-rte-shell overflow-hidden rounded-md border border-admin-input-border bg-admin-soft-2",
          "focus-within:border-brass focus-within:ring-2 focus-within:ring-brass/20",
          error && "border-admin-danger! focus-within:ring-admin-danger/20",
        )}
      >
        <div className="flex flex-wrap items-center gap-0.5 border-b border-admin-line bg-admin-paper px-1.5 py-1">
          <ToolbarButton
            label="Bold"
            active={editor?.isActive("bold")}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          >
            <IconBold />
          </ToolbarButton>
          <ToolbarButton
            label="Italic"
            active={editor?.isActive("italic")}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          >
            <IconItalic />
          </ToolbarButton>
          <ToolbarButton
            label="Underline"
            active={editor?.isActive("underline")}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
          >
            <IconUnderline />
          </ToolbarButton>
          <span className="mx-1 h-5 w-px bg-admin-line" aria-hidden />
          <ToolbarButton
            label="Heading"
            wide
            active={editor?.isActive("heading", { level: 2 })}
            disabled={!editor}
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            <TextHeading />
          </ToolbarButton>
          <ToolbarButton
            label="Subheading"
            wide
            active={editor?.isActive("heading", { level: 3 })}
            disabled={!editor}
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 3 }).run()
            }
          >
            <TextSubheading />
          </ToolbarButton>
          <span className="mx-1 h-5 w-px bg-admin-line" aria-hidden />
          <ToolbarButton
            label="Bullet list"
            active={editor?.isActive("bulletList")}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            <IconList />
          </ToolbarButton>
          <ToolbarButton
            label="Numbered list"
            active={editor?.isActive("orderedList")}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          >
            <IconOrdered />
          </ToolbarButton>
          <ToolbarButton
            label="Quote"
            active={editor?.isActive("blockquote")}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          >
            <IconQuote />
          </ToolbarButton>
          <ToolbarButton
            label="Separator"
            active={editor?.isActive("horizontalRule")}
            disabled={!editor}
            onClick={() => editor?.chain().focus().setHorizontalRule().run()}
          >
            <IconSeparator />
          </ToolbarButton>
          <span className="mx-1 h-5 w-px bg-admin-line" aria-hidden />
          <ToolbarButton
            label="Link"
            active={editor?.isActive("link")}
            disabled={!editor}
            onClick={openLinkDialog}
          >
            <IconLink />
          </ToolbarButton>
          <ToolbarButton
            label="Clear formatting"
            disabled={!editor}
            onClick={() =>
              editor?.chain().focus().unsetAllMarks().clearNodes().run()
            }
          >
            <IconClear />
          </ToolbarButton>
        </div>
        <EditorContent editor={editor} className={cn("block", minHeightClass)} />
      </div>
      <AdminFieldError message={error} />
      <LinkDialog
        open={linkDialog !== null}
        initial={linkDialog?.href ?? ""}
        editing={linkDialog?.editing ?? false}
        onClose={() => closeLinkDialog(() => editor?.commands.focus())}
        onApply={applyLink}
        onRemove={removeLink}
        onAfterClose={() => {
          const run = afterLinkDialog.current;
          afterLinkDialog.current = null;
          if (run) run();
          else editor?.commands.focus();
        }}
      />
    </div>
  );
}
