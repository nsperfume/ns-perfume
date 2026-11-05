"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type StoryPanel = { id: string; label: string; content: ReactNode };

/**
 * One panel at a time, so long copy does not stretch the section. Hidden panels
 * stay in the page's HTML, where search engines can still read them.
 */
export function StoryTabs({ label, panels }: { label: string; panels: StoryPanel[] }) {
  const baseId = useId();
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: KeyboardEvent) {
    const last = panels.length - 1;
    const next =
      e.key === "ArrowRight"
        ? active === last ? 0 : active + 1
        : e.key === "ArrowLeft"
          ? active === 0 ? last : active - 1
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? last
              : null;
    if (next === null) return;
    e.preventDefault();
    setActive(next);
    tabs.current[next]?.focus();
  }

  return (
    <div>
      {panels.length > 1 ? (
        <div
          role="tablist"
          aria-label={label}
          onKeyDown={onKeyDown}
          className="flex gap-6 overflow-x-auto border-b border-hairline sm:gap-8"
        >
          {panels.map((panel, i) => (
            <button
              key={panel.id}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${panel.id}`}
              aria-selected={i === active}
              aria-controls={`${baseId}-panel-${panel.id}`}
              tabIndex={i === active ? 0 : -1}
              onClick={() => setActive(i)}
              className={cn(
                "-mb-px min-h-12 shrink-0 cursor-pointer border-b-2 text-label transition-colors",
                i === active
                  ? "border-brass text-ink"
                  : "border-transparent text-taupe hover:text-ink",
              )}
            >
              {panel.label}
            </button>
          ))}
        </div>
      ) : null}
      {panels.map((panel, i) => (
        <div
          key={panel.id}
          role={panels.length > 1 ? "tabpanel" : undefined}
          id={`${baseId}-panel-${panel.id}`}
          aria-labelledby={panels.length > 1 ? `${baseId}-tab-${panel.id}` : undefined}
          hidden={i !== active}
          className="pt-6"
        >
          {panel.content}
        </div>
      ))}
    </div>
  );
}
