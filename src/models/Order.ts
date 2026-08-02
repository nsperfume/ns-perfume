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
  },
  { _id: false },
);

const OrderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, index: true },
    phone: { type: String, default: "" },
    customerName: { type: String, default: "" },
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
    shippingPkr: { type: Number, default: 0 },
    totalPkr: { type: Number, default: 0 },
    lines: { type: [OrderLineSchema], default: [] },
    shippingAddress: {
      line1: String,
      city: String,
      province: String,
      postalCode: String,
      country: { type: String, default: "PK" },
    },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

export const OrderModel = models.Order || model("Order", OrderSchema);
