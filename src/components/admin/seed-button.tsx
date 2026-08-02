"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SeedCatalogButton() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const router = useRouter();

  async function seed(force = false) {
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/seed${force ? "?force=1" : ""}`, {
        method: "POST",
      });
      const json = await res.json();
      if (!json.ok) {
        setMsg(json.error || "Seed failed");
      } else {
        setMsg(
          `Seeded ${json.data.products} products · login ${json.data.adminEmail}`,
        );
        router.refresh();
      }
    } catch {
      setMsg("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={loading}
        onClick={() => seed(false)}
        className="rounded-lg bg-[#1a1a1a] px-4 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-50"
      >
        {loading ? "Seeding…" : "Seed catalog"}
      </button>
      <button
        type="button"
        disabled={loading}
        onClick={() => seed(true)}
        className="text-xs text-[#6d7175] underline-offset-2 hover:underline"
      >
        Force re-seed (wipes catalog)
      </button>
      {msg ? <p className="max-w-xs text-right text-xs text-[#6d7175]">{msg}</p> : null}
    </div>
  );
}
