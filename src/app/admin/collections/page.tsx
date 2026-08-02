"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";

type Collection = {
  _id: string;
  handle: string;
  title: string;
  description?: string;
  status?: string;
  filterTags?: string[];
};

export default function AdminCollectionsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(null);
  const [items, setItems] = useState<Collection[]>([]);
  const [title, setTitle] = useState("");
  const [handle, setHandle] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/auth")
      .then((r) => r.json())
      .then((j) => {
        if (!j.ok) router.replace("/admin/login");
        else setUser(j.data);
      });
    // Admin list needs all collections - public API only active; use products trick
    fetch("/api/collections")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setItems(j.data);
      });
  }, [router]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        handle,
        title,
        description: "",
        seoCopy: "",
        status: "active",
        filterTags: [],
      }),
    });
    const json = await res.json();
    if (!json.ok) {
      setError(json.error);
      return;
    }
    setTitle("");
    setHandle("");
    setItems((prev) => [...prev, json.data]);
  }

  return (
    <AdminShell user={user}>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Collections</h1>
      <form
        onSubmit={create}
        className="mb-8 grid max-w-xl gap-3 rounded-xl border border-[#e1e3e5] bg-white p-6 sm:grid-cols-2"
      >
        <label className="text-sm font-medium sm:col-span-2">
          Title
          <input
            required
            className="mt-1 w-full rounded-lg border border-[#c9cccf] px-3 py-2 text-sm"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setHandle(
                e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
              );
            }}
          />
        </label>
        <label className="text-sm font-medium sm:col-span-2">
          Handle
          <input
            required
            className="mt-1 w-full rounded-lg border border-[#c9cccf] px-3 py-2 text-sm"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
          />
        </label>
        {error ? <p className="text-sm text-red-600 sm:col-span-2">{error}</p> : null}
        <button
          type="submit"
          className="rounded-lg bg-[#1a1a1a] px-4 py-2 text-sm font-medium text-white sm:col-span-2"
        >
          Create collection
        </button>
      </form>
      <div className="overflow-hidden rounded-xl border border-[#e1e3e5] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[#e1e3e5] bg-[#f6f6f7] text-[#6d7175]">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Handle</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.handle} className="border-b border-[#e1e3e5]">
                <td className="px-4 py-3 font-medium">{c.title}</td>
                <td className="px-4 py-3 font-mono text-xs">{c.handle}</td>
                <td className="px-4 py-3">{c.status || "active"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
