// models/Testimonial.js
// Customer reviews shown on the homepage. Admin approves before display,
// so a bad-faith or spam review never goes live automatically.

const mongoose = require("mongoose");

const testimonialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    city: { type: String, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    message: { type: String, required: true, maxlength: 500 },
    isApproved: { type: Boolean, default: false }, // admin must approve
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Testimonial", testimonialSchema);
