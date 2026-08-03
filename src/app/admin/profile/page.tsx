import { redirect } from "next/navigation";

/** Profile lives under Settings. */
export default function AdminProfileRedirect() {
  redirect("/admin/settings");
}
