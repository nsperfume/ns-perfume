/**
 * Server-side input rules for admin catalog writes. Only listed fields are
 * accepted (no mass assignment); `details.fieldErrors` lets forms show errors inline.
 */
import { z } from "zod";
import { jsonError } from "@/lib/api";

const text = (max: number) => z.string().trim().max(max, `Keep this under ${max} characters`);
const imageUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || v.startsWith("/") || /^https:\/\//.test(v), "Use an uploaded image");
const noteList = z.array(text(60).min(1)).max(12, "Add up to 12 notes");

export const HANDLE_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const sizeSchema = z
  .object({
    ml: z.number({ error: "Enter the size in ml" }).int("Use whole millilitres").min(1, "Size must be at least 1 ml").max(1000),
    pricePkr: z.number({ error: "Enter a price" }).int("Use a whole rupee amount").min(1, "Price must be above zero").max(10_000_000),
    sku: text(60).min(1, "SKU is required").regex(/^[A-Za-z0-9._-]+$/, "Use letters, numbers, dots or dashes"),
    compareAtPkr: z.number().int().min(1).max(10_000_000).optional().nullable(),
  })
  .refine((s) => s.compareAtPkr == null || s.compareAtPkr > s.pricePkr, {
    message: "Compare-at price must be higher than the price",
    path: ["compareAtPkr"],
  });

const productFields = {
  handle: text(80).regex(HANDLE_RE, "Use lowercase letters, numbers and single dashes"),
  name: text(80).min(2, "Name is required"),
  descriptor: text(160),
  description: text(20_000),
  concentration: z.enum(["EDP", "EDT", "PARFUM"]),
  family: text(40),
  gender: z.enum(["her", "him", "unisex"]),
  sizes: z
    .array(sizeSchema)
    .min(1, "Add at least one size")
    .max(8)
    .refine((list) => new Set(list.map((s) => s.sku.toLowerCase())).size === list.length, "Each size needs its own SKU")
    .refine((list) => new Set(list.map((s) => s.ml)).size === list.length, "Each size must be different"),
  topNotes: noteList,
  heartNotes: noteList,
  baseNotes: noteList,
  sillage: z.number().int().min(1).max(5),
  longevity: z.number().int().min(1).max(5),
  ingredients: z.array(text(80).min(1)).max(60),
  containsAlcohol: z.boolean(),
  countryOfOrigin: text(60),
  story: text(20_000),
  howToWear: text(20_000),
  tags: z.array(text(60).min(1)).max(40),
  collectionHandles: z.array(text(80).regex(HANDLE_RE)).max(40),
  badges: z.array(z.enum(["bestseller", "new", "limited", "sale"])).max(4),
  imagePrimary: imageUrl,
  imageSecondary: imageUrl,
  gallery: z.array(imageUrl).max(12, "Add up to 12 gallery images"),
  relatedHandles: z.array(text(80).regex(HANDLE_RE)).max(12),
  inStock: z.boolean(),
  status: z.enum(["active", "draft", "archived"]),
  seoTitle: text(70),
  seoDescription: text(170),
};

/** Publishing needs a main image; drafts may be saved without one. */
const publishRule = (p: { status?: string; imagePrimary?: string }) => p.status !== "active" || Boolean(p.imagePrimary);
const publishIssue = { message: "Add a main image before publishing", path: ["imagePrimary"] };

export const productCreateSchema = z
  .object(productFields)
  .partial()
  .required({ handle: true, name: true, sizes: true })
  .strip()
  .refine(publishRule, publishIssue);

export const productUpdateSchema = z.object(productFields).partial().strip();

export const testimonialSchema = z
  .object({
    author: text(80).min(2, "Name is required"),
    city: text(60),
    quote: text(600).min(10, "Quote is too short"),
    rating: z.number().int().min(1).max(5),
    productName: text(80),
    avatarUrl: imageUrl,
    featured: z.boolean(),
    status: z.enum(["published", "draft"]),
    sortOrder: z.number().int().min(0).max(9999),
  })
  .partial()
  .strip();

/** 400 response carrying the first message plus per-field errors. */
export function validationError(error: z.ZodError) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return jsonError(error.issues[0]?.message || "Check the highlighted fields", 400, { fieldErrors });
}

/** Mongo duplicate-key error (E11000). */
export function isDuplicateKey(e: unknown) {
  return typeof e === "object" && e !== null && (e as { code?: number }).code === 11000;
}
