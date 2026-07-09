// models/Newsletter.js
// Email subscribers from the newsletter signup box.

const mongoose = require("mongoose");

const newsletterSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    isActive: { type: Boolean, default: true }, // false if they unsubscribe
  },
  { timestamps: true }
);

module.exports = mongoose.model("Newsletter", newsletterSchema);
