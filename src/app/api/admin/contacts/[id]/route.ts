import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { ContactMessageModel } from "@/models/ContactMessage";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const admin = await requireAdmin();
    if (!admin) return jsonError("Unauthorized", 401);
    await connectDB();

    const { id } = await ctx.params;
    const body = await req.json();
    const status = body?.status as string | undefined;
    if (!status || !["new", "read", "closed"].includes(status)) {
      return jsonError("status must be new, read, or closed");
    }

    const doc = await ContactMessageModel.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    ).lean();
    if (!doc) return jsonError("Message not found", 404);

    return jsonOk({
      id: String(doc._id),
      name: doc.name,
      email: doc.email,
      topic: doc.topic || "general",
      message: doc.message,
      status: doc.status || "new",
      createdAt: doc.createdAt
        ? new Date(doc.createdAt as Date).toISOString()
        : undefined,
    });
  } catch (e) {
    console.error(e);
    return jsonError("Failed to update contact", 500);
  }
}
