import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { absoluteUrl } from "@/lib/site-url";
import { hashLinkToken } from "@/lib/tokens";
import { CustomerModel } from "@/models/Customer";

/** Link from the welcome / confirm email. Marks the address verified and returns to the account page. */
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return NextResponse.redirect(absoluteUrl("/account?verify=invalid"));
  try {
    await connectDB();
    const res = await CustomerModel.updateOne(
      {
        emailVerifyTokenHash: hashLinkToken(token),
        emailVerifyExpires: { $gt: new Date() },
      },
      {
        $set: { emailVerified: true, emailVerifyTokenHash: "", emailVerifyExpires: null },
      },
    );
    return NextResponse.redirect(
      absoluteUrl(res.modifiedCount ? "/account?verify=done" : "/account?verify=invalid"),
    );
  } catch (e) {
    console.error(e);
    return NextResponse.redirect(absoluteUrl("/account?verify=invalid"));
  }
}
