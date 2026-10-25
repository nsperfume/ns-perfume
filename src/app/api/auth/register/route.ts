import { z } from "zod";
import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import {
  createCustomerToken,
  hashPassword,
  setCustomerSessionCookie,
} from "@/lib/customer-auth";
import { CustomerModel } from "@/models/Customer";
import { limitByIp } from "@/lib/rate-limit";
import { notifyWelcome } from "@/lib/email";
import { createLinkToken } from "@/lib/tokens";

const schema = z.object({
  name: z.string().trim().min(2, "Name is required").max(80),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "Use at least 8 characters"),
});

export async function POST(req: Request) {
  try {
    const limited = limitByIp(req, "register", 5, 60 * 60_000);
    if (limited) return limited;
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
    const verify = createLinkToken();
    const created = await CustomerModel.create({
      email,
      name: parsed.data.name.trim(),
      passwordHash,
      emailVerified: false,
      emailVerifyTokenHash: verify.hash,
      emailVerifyExpires: new Date(Date.now() + 48 * 60 * 60 * 1000),
    });
    notifyWelcome({ email: created.email, name: created.name || "" }, verify.token);

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
