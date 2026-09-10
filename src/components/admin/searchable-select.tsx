"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { AdminFieldLabel } from "@/components/admin/form-section";
import { cn } from "@/lib/cn";

export type SearchableOption = {
  value: string;
  label: string;
  hint?: string;
};

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SearchableOption[];
  placeholder?: string;
  tip?: string;
  error?: string;
  emptyLabel?: string;
  className?: string;
};

/**
 * Combobox: click opens list, typing filters, Enter/blur commits search or custom value.
 */
export function AdminSearchableSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Search or type…",
  tip,
  error,
  emptyLabel = "No matches. Keep typing to use a custom value.",
  className,
}: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const queryRef = useRef(query);
  const optionsRef = useRef(options);
  const onChangeRef = useRef(onChange);

  queryRef.current = query;
  optionsRef.current = options;
  onChangeRef.current = onChange;

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) {
      setQuery(selected ? selected.label : value);
    }
  }, [value, selected, open]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen((wasOpen) => {
          if (wasOpen) {
            const q = queryRef.current.trim();
            const opts = optionsRef.current;
            if (!q) onChangeRef.current("");
            else {
              const match =
                opts.find((o) => o.value === q) ||
                opts.find((o) => o.label.toLowerCase() === q.toLowerCase());
              onChangeRef.current(match ? match.value : q);
            }
          }
          return false;
        });
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options.slice(0, 40);
    return options
      .filter((o) => {
        const hay = `${o.label} ${o.value} ${o.hint || ""}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 40);
  }, [options, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  function choose(option: SearchableOption) {
    onChange(option.value);
    setQuery(option.label);
    setOpen(false);
  }

  function commitQuery() {
    const q = query.trim();
    if (!q) {
      onChange("");
      return;
    }
    const match =
      options.find((o) => o.value === q) ||
      options.find((o) => o.label.toLowerCase() === q.toLowerCase());
    if (match) {
      onChange(match.value);
      setQuery(match.label);
      return;
    }
    onChange(q);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (e.key === "Escape") {
      setQuery(selected ? selected.label : value);
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const hit = filtered[activeIndex];
      if (hit) choose(hit);
      else {
        commitQuery();
        setOpen(false);
      }
    }
  }

  return (
    <div ref={rootRef} className={cn("relative block", className)}>
      <AdminFieldLabel tip={tip}>{label}</AdminFieldLabel>
      <input
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        value={open ? query : selected ? selected.label : value}
        placeholder={placeholder}
        onFocus={() => {
          setOpen(true);
          setQuery(selected ? selected.label : value);
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
        className={cn(
          "h-11 w-full rounded-md border border-admin-input-border bg-admin-soft-2 px-3.5 text-sm text-admin-ink outline-none",
          "placeholder:text-admin-faint focus:border-brass focus:ring-2 focus:ring-brass/20",
          error && "border-rosewood focus:ring-rosewood/20",
        )}
      />
      {value ? (
        <p className="mt-1 font-mono text-[11px] text-admin-faint">
          {value}
          {selected?.hint ? ` · ${selected.hint}` : ""}
        </p>
      ) : null}
      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-70 mt-1 max-h-60 w-full overflow-auto rounded-md border border-admin-line bg-admin-paper py-1 shadow-lg"
        >
          {filtered.length ? (
            filtered.map((option, index) => (
              <li
                key={option.value}
                role="option"
                aria-selected={value === option.value}
              >
                <button
                  type="button"
                  className={cn(
                    "flex w-full cursor-pointer flex-col items-start px-3 py-2 text-left text-sm transition-colors",
                    index === activeIndex || value === option.value
                      ? "bg-admin-soft text-admin-ink"
                      : "text-admin-ink hover:bg-admin-soft-2",
                  )}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => choose(option)}
                >
                  <span className="font-medium">{option.label}</span>
                  <span className="font-mono text-[11px] text-admin-faint">
                    {option.value}
                    {option.hint ? ` · ${option.hint}` : ""}
                  </span>
                </button>
              </li>
            ))
          ) : (
            <li className="px-3 py-3 text-sm text-admin-muted">
              {emptyLabel}
            </li>
          )}
        </ul>
      ) : null}
      {error ? (
        <p className="mt-1.5 text-sm text-rosewood">{error}</p>
      ) : null}
    </div>
  );
}
