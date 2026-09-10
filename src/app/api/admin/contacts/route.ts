import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { ContactMessageModel } from "@/models/ContactMessage";

export async function GET(req: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) return jsonError("Unauthorized", 401);
    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {};
    if (status && ["new", "read", "closed"].includes(status)) {
      filter.status = status;
    }

    const docs = await ContactMessageModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return jsonOk(
      docs.map((d) => ({
        id: String(d._id),
        name: d.name,
        email: d.email,
        topic: d.topic || "general",
        message: d.message,
        status: d.status || "new",
        createdAt: d.createdAt
          ? new Date(d.createdAt as Date).toISOString()
          : undefined,
        updatedAt: d.updatedAt
          ? new Date(d.updatedAt as Date).toISOString()
          : undefined,
      })),
    );
  } catch (e) {
    console.error(e);
    return jsonError("Failed to load contacts", 500);
  }
}
