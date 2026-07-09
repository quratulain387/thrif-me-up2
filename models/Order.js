// models/Order.js
// One order per checkout. Snapshots product name/price at time of purchase
// so historical orders stay accurate even if a product is edited later.

const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        name: { type: String, required: true }, // snapshot at purchase time
        image: { type: String },
        price: { type: Number, required: true }, // snapshot at purchase time
        size: { type: String },
        quantity: { type: Number, required: true, default: 1, min: 1 },
      },
    ],
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String },
      country: { type: String, default: "Pakistan" },
    },
    paymentMethod: {
      type: String,
      enum: ["Bank Transfer", "Online Transfer"],
      default: "Bank Transfer",
    },
    itemsPrice: { type: Number, required: true },
    shippingPrice: { type: Number, required: true, default: 250 }, // flat nationwide rate
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },
    deliveredAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
