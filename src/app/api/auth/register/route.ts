import { z } from "zod";
import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import {
  createCustomerToken,
  hashPassword,
  setCustomerSessionCookie,
} from "@/lib/customer-auth";
import { CustomerModel } from "@/models/Customer";

const schema = z.object({
  name: z.string().trim().min(2, "Name is required").max(80),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "Use at least 8 characters"),
});

export async function POST(req: Request) {
  try {
    const raw = await req.json();
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      return jsonError(
        parsed.error.issues[0]?.message || "Invalid details",
        400,
      );
    }

    await connectDB();
    const email = parsed.data.email.toLowerCase();
    const existing = await CustomerModel.findOne({ email }).lean();
    if (existing) {
      return jsonError("An account with this email already exists. Sign in instead.", 409);
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const created = await CustomerModel.create({
      email,
      name: parsed.data.name.trim(),
      passwordHash,
      emailVerified: false,
    });

    const token = await createCustomerToken({
      sub: String(created._id),
      email: created.email,
      name: created.name || "",
    });
    await setCustomerSessionCookie(token);

    return jsonOk(
      {
        id: String(created._id),
        email: created.email,
        name: created.name,
        phone: created.phone || "",
      },
      { status: 201 },
    );
  } catch (e) {
    console.error(e);
    return jsonError("Could not create account", 500);
  }
}
