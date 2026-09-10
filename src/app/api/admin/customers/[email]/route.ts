import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { getAdminCustomerDetail } from "@/lib/admin-customers";

type Ctx = { params: Promise<{ email: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const admin = await requireAdmin();
    if (!admin) return jsonError("Unauthorized", 401);
    await connectDB();

    const { email: raw } = await ctx.params;
    const email = decodeURIComponent(raw || "").trim();
    if (!email) return jsonError("Email is required");

    const data = await getAdminCustomerDetail(email);
    if (!data) return jsonError("Customer not found", 404);
    return jsonOk(data);
  } catch (e) {
    console.error(e);
    return jsonError("Failed to load customer", 500);
  }
}
