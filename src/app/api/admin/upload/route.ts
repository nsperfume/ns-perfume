import { jsonError, jsonOk } from "@/lib/api";
import { requireAdminWrite, adminDenied } from "@/lib/auth";
import { configureCloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";

/*
 * Signs one image upload. The browser then sends the file straight to Cloudinary,
 * because hosting refuses request bodies over 4.5 MB before a route like this runs.
 * The secret stays here. The signature only allows these formats (no SVG: it can
 * carry script) in this folder, for one hour.
 */
const ALLOWED_FORMATS = "jpg,png,webp,avif";

export async function POST() {
  try {
    const admin = await requireAdminWrite();
    if (!admin) return adminDenied();

    if (!isCloudinaryConfigured()) {
      return jsonError(
        "Image uploads are not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
        503,
      );
    }

    const params = {
      allowed_formats: ALLOWED_FORMATS,
      folder: process.env.CLOUDINARY_FOLDER || "ns-perfume",
      timestamp: Math.round(Date.now() / 1000),
    };
    const cloudinary = configureCloudinary();
    return jsonOk({
      ...params,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      signature: cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET as string),
    });
  } catch (e) {
    console.error(e);
    return jsonError("Could not start the upload", 500);
  }
}
