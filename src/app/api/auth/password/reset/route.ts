import { z } from "zod";
import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { limitByIp } from "@/lib/rate-limit";
import {
  createCustomerToken,
  hashPassword,
  setCustomerSessionCookie,
} from "@/lib/customer-auth";
import { notifyPasswordChanged } from "@/lib/email";
import { hashLinkToken } from "@/lib/tokens";
import { CustomerModel } from "@/models/Customer";

const schema = z.object({
  token: z.string().min(20).max(200),
  password: z.string().min(8, "Use at least 8 characters").max(200),
});

export async function POST(req: Request) {
  try {
    const limited = limitByIp(req, "password-reset", 10, 30 * 60_000);
    if (limited) return limited;
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message || "Invalid request", 400);
    }

    await connectDB();
    const customer = await CustomerModel.findOne({
      passwordResetTokenHash: hashLinkToken(parsed.data.token),
      passwordResetExpires: { $gt: new Date() },
    });
    if (!customer) {
      return jsonError("This reset link is invalid or has expired. Request a new one.", 400);
    }

    customer.passwordHash = await hashPassword(parsed.data.password);
    customer.passwordResetTokenHash = "";
    customer.passwordResetExpires = null;
    // Opening the link proves the inbox belongs to this customer.
    customer.emailVerified = true;
    await customer.save();

    notifyPasswordChanged({ email: customer.email, name: customer.name || "" });

    const session = await createCustomerToken({
      sub: String(customer._id),
      email: customer.email,
      name: customer.name || "",
    });
    await setCustomerSessionCookie(session);
    return jsonOk({ reset: true });
  } catch (e) {
    console.error(e);
    return jsonError("Could not reset the password. Please try again.", 500);
  }
}
