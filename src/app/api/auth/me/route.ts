import { z } from "zod";
import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import {
  createCustomerToken,
  getCustomerSession,
  setCustomerSessionCookie,
} from "@/lib/customer-auth";
import { CustomerModel } from "@/models/Customer";
import { googleOAuthConfigured } from "@/lib/customer-auth";

export async function GET() {
  try {
    const session = await getCustomerSession();
    if (!session) {
      return jsonOk({
        user: null,
        googleEnabled: googleOAuthConfigured(),
      });
    }
    await connectDB();
    const doc = await CustomerModel.findById(session.sub).lean();
    if (!doc) {
      return jsonOk({
        user: null,
        googleEnabled: googleOAuthConfigured(),
      });
    }
    return jsonOk({
      user: {
        id: String(doc._id),
        email: doc.email,
        name: doc.name || "",
        phone: doc.phone || "",
        avatarUrl: doc.avatarUrl || "",
        hasPassword: Boolean(doc.passwordHash),
        hasGoogle: Boolean(doc.googleId),
      },
      googleEnabled: googleOAuthConfigured(),
    });
  } catch (e) {
    console.error(e);
    return jsonError("Could not load session", 500);
  }
}

const patchSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  phone: z.string().trim().max(30).optional(),
});

export async function PATCH(req: Request) {
  try {
    const session = await getCustomerSession();
    if (!session) return jsonError("Sign in to update your profile", 401);

    const raw = await req.json();
    const parsed = patchSchema.safeParse(raw);
    if (!parsed.success) {
      return jsonError(
        parsed.error.issues[0]?.message || "Invalid details",
        400,
      );
    }

    await connectDB();
    const updates: Record<string, string> = {};
    if (parsed.data.name !== undefined) updates.name = parsed.data.name;
    if (parsed.data.phone !== undefined) updates.phone = parsed.data.phone;

    const doc = await CustomerModel.findByIdAndUpdate(session.sub, updates, {
      new: true,
    });
    if (!doc) return jsonError("Account not found", 404);

    const token = await createCustomerToken({
      sub: String(doc._id),
      email: doc.email,
      name: doc.name || "",
    });
    await setCustomerSessionCookie(token);

    return jsonOk({
      id: String(doc._id),
      email: doc.email,
      name: doc.name || "",
      phone: doc.phone || "",
      avatarUrl: doc.avatarUrl || "",
    });
  } catch (e) {
    console.error(e);
    return jsonError("Could not update profile", 500);
  }
}
