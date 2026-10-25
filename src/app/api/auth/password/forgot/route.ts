import { z } from "zod";
import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { limitByIp, rateLimit } from "@/lib/rate-limit";
import { notifyPasswordReset } from "@/lib/email";
import { createLinkToken } from "@/lib/tokens";
import { CustomerModel } from "@/models/Customer";

const schema = z.object({ email: z.string().trim().toLowerCase().email("Enter a valid email") });

/** Same response whether or not the account exists, so emails can't be enumerated. */
const GENERIC = "If an account exists for that email, a reset link is on its way. It expires in 1 hour.";

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message || "Enter a valid email", 400);
    }
    const { email } = parsed.data;
    const limited =
      limitByIp(req, "password-forgot", 5, 30 * 60_000) ||
      rateLimit(`password-forgot:${email}`, 3, 60 * 60_000);
    if (limited) return limited;

    await connectDB();
    const customer = await CustomerModel.findOne({ email });
    if (customer) {
      const reset = createLinkToken();
      customer.passwordResetTokenHash = reset.hash;
      customer.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
      await customer.save();
      notifyPasswordReset({ email: customer.email, name: customer.name || "" }, reset.token);
    }
    return jsonOk({ message: GENERIC });
  } catch (e) {
    console.error(e);
    return jsonError("Could not start the reset. Please try again.", 500);
  }
}
