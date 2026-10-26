import { z } from "zod";

const money = (max: number, label: string) =>
  z
    .number({ error: `Enter ${label}` })
    .int("Use a whole rupee amount")
    .min(0, "Cannot be negative")
    .max(max, `Must be Rs ${max.toLocaleString("en-US")} or less`);

const shippingOption = z.object({
  enabled: z.boolean(),
  title: z.string().trim().min(1, "Name is required").max(40),
  description: z.string().trim().max(80),
  pricePkr: money(100_000, "a price"),
});

/** Admin-editable store charges. Mirrors lib/checkout-config. */
export const checkoutConfigSchema = z
  .object({
    shipping: z.object({ standard: shippingOption, express: shippingOption }),
    freeShippingThresholdPkr: money(10_000_000, "a threshold"),
    giftWrap: z.object({ enabled: z.boolean(), feePkr: money(100_000, "a gift wrap fee") }),
    codFeePkr: money(100_000, "a fee"),
    tax: z.object({
      mode: z.enum(["none", "inclusive", "exclusive"]),
      ratePercent: z.number().min(0, "Cannot be negative").max(50, "Must be 50% or less"),
      label: z.string().trim().min(1, "Tax name is required").max(20),
    }),
  })
  .refine((c) => c.shipping.standard.enabled || c.shipping.express.enabled, {
    message: "Keep at least one shipping method on",
    path: ["shipping"],
  })
  .refine((c) => c.tax.mode === "none" || c.tax.ratePercent > 0, {
    message: "Enter a tax rate, or turn tax off",
    path: ["tax", "ratePercent"],
  });
