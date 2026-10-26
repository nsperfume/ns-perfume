import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { requireAdminWrite, adminDenied } from "@/lib/auth";
import { configureCloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";

const MAX_BYTES = 8 * 1024 * 1024;

function sniffImageType(b: Buffer): string | null {
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  if (b.toString("ascii", 4, 8) === "ftyp" && /^avi[fs]$/.test(b.toString("ascii", 8, 12))) return "image/avif";
  return null;
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdminWrite();
    if (!admin) return adminDenied();

    if (!isCloudinaryConfigured()) {
      return jsonError(
        "Image uploads are not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
        503,
      );
    }

    const declared = Number(req.headers.get("content-length") || 0);
    if (declared > MAX_BYTES + 64 * 1024) {
      return jsonError("Image must be 8MB or smaller", 413);
    }

    await connectDB();
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return jsonError("file is required");

    if (file.size > MAX_BYTES) {
      return jsonError("Image must be 8MB or smaller", 400);
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    // Trust the file's magic bytes, not the browser-sent MIME type. No SVG (it can carry script).
    const type = sniffImageType(bytes);
    if (!type) {
      return jsonError("Use a JPG, PNG, WebP or AVIF image", 400);
    }
    const base64 = `data:${type};base64,${bytes.toString("base64")}`;
    const cloudinary = configureCloudinary();
    const uploaded = await cloudinary.uploader.upload(base64, {
      folder: process.env.CLOUDINARY_FOLDER || "ns-perfume",
      resource_type: "image",
      allowed_formats: ["jpg", "png", "webp", "avif"],
    });

    return jsonOk({
      url: uploaded.secure_url,
      publicId: uploaded.public_id,
      width: uploaded.width,
      height: uploaded.height,
    });
  } catch (e) {
    console.error(e);
    return jsonError("Upload failed", 500);
  }
}
