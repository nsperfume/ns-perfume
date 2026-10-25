import { jsonError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { catalogEntry } from "@/lib/email/catalog";

/** Rendered sample of one template (shown in a sandboxed iframe in admin). */
export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return jsonError("Unauthorized", 401);
  const index = Number(new URL(req.url).searchParams.get("i"));
  const entry = Number.isInteger(index) ? catalogEntry(index) : null;
  if (!entry) return jsonError("Unknown template", 404);
  return jsonOk(entry.render());
}
