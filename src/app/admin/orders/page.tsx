"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";

type Order = {
  _id: string;
  orderNumber: string;
  email: string;
  customerName?: string;
  status: string;
  totalPkr: number;
  createdAt?: string;
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetch("/api/admin/auth")
      .then((r) => r.json())
      .then((j) => {
        if (!j.ok) router.replace("/admin/login");
        else setUser(j.data);
      });
    fetch("/api/orders")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setOrders(j.data);
      });
  }, [router]);

  return (
    <AdminShell user={user}>
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">Orders</h1>
      <p className="mb-6 text-sm text-[#6d7175]">
        Checkout is not live yet. Orders appear here once cart checkout is
        connected.
      </p>
      <div className="overflow-hidden rounded-xl border border-[#e1e3e5] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[#e1e3e5] bg-[#f6f6f7] text-[#6d7175]">
            <tr>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Total (PKR)</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o._id} className="border-b border-[#e1e3e5]">
                <td className="px-4 py-3 font-mono text-xs">{o.orderNumber}</td>
                <td className="px-4 py-3">
                  {o.customerName || "—"}
                  <p className="text-xs text-[#6d7175]">{o.email}</p>
                </td>
                <td className="px-4 py-3 capitalize">{o.status}</td>
                <td className="px-4 py-3 font-mono">
                  Rs {(o.totalPkr || 0).toLocaleString("en-PK")}
                </td>
              </tr>
            ))}
            {orders.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-[#6d7175]">
                  No orders yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
