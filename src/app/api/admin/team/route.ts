import { z } from "zod";
import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import {
  requireSuperAdmin,
  hashPassword,
  normalizeRole,
} from "@/lib/auth";
import { AdminUserModel } from "@/models/AdminUser";

export async function GET() {
  const admin = await requireSuperAdmin();
  if (!admin) return jsonError("Forbidden", 403);
  await connectDB();
  const users = await AdminUserModel.find()
    .select("email name role createdAt")
    .sort({ createdAt: 1 })
    .lean();
  return jsonOk(
    users.map((u) => ({
      id: String(u._id),
      email: u.email,
      name: u.name,
      role: normalizeRole(u.role),
    })),
  );
}

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().trim().min(2).max(80),
  password: z.string().min(8).max(120),
});

export async function POST(req: Request) {
  const admin = await requireSuperAdmin();
  if (!admin) return jsonError("Forbidden", 403);
  try {
    await connectDB();
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Invalid team member data", 400, parsed.error.flatten());
    }
    const email = parsed.data.email.toLowerCase().trim();
    const exists = await AdminUserModel.findOne({ email });
    if (exists) return jsonError("An account with this email already exists", 409);

    const user = await AdminUserModel.create({
      email,
      name: parsed.data.name,
      passwordHash: await hashPassword(parsed.data.password),
      role: "admin",
    });

    return jsonOk({
      id: String(user._id),
      email: user.email,
      name: user.name,
      role: "admin" as const,
    });
  } catch (e) {
    console.error(e);
    return jsonError("Failed to create admin", 500);
  }
}
