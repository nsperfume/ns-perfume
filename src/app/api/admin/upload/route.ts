import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { configureCloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) return jsonError("Unauthorized", 401);

    if (!isCloudinaryConfigured()) {
      return jsonError(
        "Cloudinary is not configured. Paste an image URL in the “Image link” tab, or set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env.local",
        503,
      );
    }

    await connectDB();
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return jsonError("file is required");

    const maxBytes = 8 * 1024 * 1024;
    if (file.size > maxBytes) {
      return jsonError("Image must be 8MB or smaller", 400);
    }

    const type = file.type || "image/jpeg";
    if (!type.startsWith("image/")) {
      return jsonError("Only image files are allowed", 400);
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const base64 = `data:${type};base64,${bytes.toString("base64")}`;
    const cloudinary = configureCloudinary();
    const uploaded = await cloudinary.uploader.upload(base64, {
      folder: process.env.CLOUDINARY_FOLDER || "ns-perfume",
      resource_type: "image",
    });

    return jsonOk({
      url: uploaded.secure_url,
      publicId: uploaded.public_id,
      width: uploaded.width,
      height: uploaded.height,
    });
  } catch (e) {
    console.error(e);
    return jsonError("Upload failed", 500, String(e));
  }
}
