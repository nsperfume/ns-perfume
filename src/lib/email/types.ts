export type EmailContent = {
  subject: string;
  html: string;
  text: string;
};

/** Every transactional email the store sends. Used for logging and the admin preview. */
export type EmailTemplateId =
  | "order-confirmation"
  | "order-confirmed"
  | "order-shipped"
  | "order-delivered"
  | "order-cancelled"
  | "admin-new-order"
  | "welcome"
  | "verify-email"
  | "password-reset"
  | "password-changed"
  | "contact-received"
  | "admin-new-contact"
  | "newsletter-welcome"
  | "test";
