import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { listAdminCustomers } from "@/lib/admin-customers";

export async function GET(req: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) return jsonError("Unauthorized", 401);
    await connectDB();

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || undefined;
    const sortParam = searchParams.get("sort");
    const sort =
      sortParam === "spend" || sortParam === "orders" || sortParam === "lastOrder"
        ? sortParam
        : "lastOrder";

    const data = await listAdminCustomers({ q, sort });
    return jsonOk(data);
  } catch (e) {
    console.error(e);
    return jsonError("Failed to load customers", 500);
  }
}
