import { getAdminSession } from "@/lib/auth";

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Session available for nested routes; login page has no shell
  void (await getAdminSession());
  return children;
}
