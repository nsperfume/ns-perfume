import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireSuperAdmin, normalizeRole } from "@/lib/auth";
import { AdminUserModel } from "@/models/AdminUser";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, ctx: Ctx) {
  const admin = await requireSuperAdmin();
  if (!admin) return jsonError("Forbidden", 403);
  try {
    const { id } = await ctx.params;
    if (id === admin.sub) {
      return jsonError("You cannot remove your own account", 400);
    }
    await connectDB();
    const user = await AdminUserModel.findById(id);
    if (!user) return jsonError("User not found", 404);
    if (normalizeRole(user.role) === "super_admin") {
      return jsonError("Cannot remove a super admin", 400);
    }
    await AdminUserModel.findByIdAndDelete(id);
    return jsonOk({ id });
  } catch (e) {
    console.error(e);
    return jsonError("Failed to remove admin", 500);
  }
}
