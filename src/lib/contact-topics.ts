/**
 * Contact form topics, shared by the form, the API, the emails and admin.
 * Kept free of zod so the storefront can render the form without the schema.
 */
export const CONTACT_TOPICS = [
  { value: "order", label: "Order help" },
  { value: "shipping", label: "Shipping and delivery" },
  { value: "product", label: "Fragrance advice" },
  { value: "general", label: "Something else" },
] as const;

export type ContactTopic = (typeof CONTACT_TOPICS)[number]["value"];

export const CONTACT_MESSAGE_MAX = 2000;

export function contactTopicLabel(value: string) {
  return CONTACT_TOPICS.find((t) => t.value === value)?.label ?? "Something else";
}

/** Topics where an order number helps the team find the parcel. */
export function topicNeedsOrder(topic: string) {
  return topic === "order" || topic === "shipping";
}
