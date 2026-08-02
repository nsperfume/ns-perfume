"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function TrackOrderPage() {
  const [order, setOrder] = useState("");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <section className="bg-canvas section-y">
      <div className="container-ns max-w-md">
        <h1 className="text-display-lg mb-4">Track my order</h1>
        <p className="mb-8 text-body text-taupe">
          Enter the order number and email used at checkout.
        </p>
        <form
          className="flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            setResult(null);
            try {
              const res = await fetch("/api/orders/track", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderNumber: order, email }),
              });
              const json = await res.json();
              if (!json.ok) {
                setResult(json.error);
              } else {
                setResult(
                  `Order ${json.data.orderNumber} is ${json.data.status}. Total Rs ${Number(json.data.totalPkr).toLocaleString("en-PK")}.`,
                );
              }
            } catch {
              setResult("Could not reach the server. Try again shortly.");
            } finally {
              setLoading(false);
            }
          }}
        >
          <Input
            label="Order number"
            name="order"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            placeholder="NS-1001"
            required
          />
          <Input
            label="Email"
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
          <Button type="submit" disabled={loading}>
            {loading ? "Looking up…" : "Look up"}
          </Button>
        </form>
        {result ? (
          <p className="mt-8 border border-hairline bg-paper p-6 text-body text-taupe">
            {result}
          </p>
        ) : null}
      </div>
    </section>
  );
}
