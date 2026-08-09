import mongoose, { Schema, models, model } from "mongoose";

const OrderLineSchema = new Schema(
  {
    productHandle: String,
    name: String,
    sizeMl: Number,
    sku: String,
    quantity: Number,
    unitPricePkr: Number,
    image: String,
    isGift: { type: Boolean, default: false },
    giftMessage: { type: String, default: "" },
    giftWrap: { type: Boolean, default: false },
  },
  { _id: false },
);

const AddressSchema = new Schema(
  {
    firstName: String,
    lastName: String,
    company: String,
    address1: String,
    address2: String,
    city: String,
    province: String,
    postalCode: String,
    country: { type: String, default: "PK" },
    phone: String,
    line1: String,
  },
  { _id: false },
);

const OrderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, index: true },
    phone: { type: String, default: "" },
    customerName: { type: String, default: "" },
    customerId: { type: String, default: "", index: true },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "shipped",
        "delivered",
        "cancelled",
      ],
      default: "pending",
      index: true,
    },
    currency: { type: String, default: "PKR" },
    subtotalPkr: { type: Number, default: 0 },
    discountPkr: { type: Number, default: 0 },
    discountCode: { type: String, default: "" },
    shippingPkr: { type: Number, default: 0 },
    taxPkr: { type: Number, default: 0 },
    totalPkr: { type: Number, default: 0 },
    lines: { type: [OrderLineSchema], default: [] },
    shippingAddress: { type: AddressSchema, default: {} },
    billingAddress: { type: AddressSchema, default: {} },
    billingSameAsShipping: { type: Boolean, default: true },
    shippingMethod: {
      id: String,
      title: String,
      description: String,
    },
    paymentMethod: {
      type: String,
      enum: ["cod", "card", "bank"],
      default: "cod",
    },
    cardLast4: { type: String, default: "" },
    marketingOptIn: { type: Boolean, default: false },
    notes: { type: String, default: "" },
    /** Fulfillment / Shopify-style tracking */
    carrier: { type: String, default: "" },
    trackingNumber: { type: String, default: "" },
    trackingUrl: { type: String, default: "" },
    estimatedDeliveryFrom: { type: Date, default: null },
    estimatedDeliveryTo: { type: Date, default: null },
    confirmedAt: { type: Date, default: null },
    shippedAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const OrderModel = models.Order || model("Order", OrderSchema);
