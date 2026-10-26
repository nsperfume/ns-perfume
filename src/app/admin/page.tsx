import type { Metadata } from "next";
import { AdminDashboard } from "./dashboard-client";

// Absolute: a page cannot use the template set by the layout in its own folder.
export const metadata: Metadata = { title: { absolute: "Dashboard | NS Admin" } };

export default function AdminHomePage() {
  return <AdminDashboard />;
}
