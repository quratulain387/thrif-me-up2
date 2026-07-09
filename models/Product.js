// models/Product.js
// Core product catalog. Thrift-specific: most items are one-of-one,
// so `stock` is usually 1 and `condition` matters a lot to buyers.

const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    compareAtPrice: {
      // original/"was" price, used to show a discount strike-through
      type: Number,
      min: 0,
    },
    size: {
      type: String,
      enum: ["XS", "S", "M", "L", "XL", "XXL", "One Size", "Free Size"],
      required: [true, "Size is required"],
    },
    condition: {
      type: String,
      enum: ["New with tags", "Excellent", "Very Good", "Good", "Fair"],
      required: [true, "Condition is required"],
    },
    images: [
      {
        type: String, // file paths / URLs
        required: true,
      },
    ],
    video: {
      type: String, // optional Cloudinary video URL, shown on product/home pages
      default: "",
    },
    stock: {
      type: Number,
      default: 1, // most thrift pieces are one-of-one
      min: 0,
    },
    isFeatured: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: true },
    isBestSeller: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }, // false once sold/removed
    ratingsAverage: { type: Number, default: 0, min: 0, max: 5 },
    ratingsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Auto-generate a unique-ish slug from the name + a short random suffix
productSchema.pre("validate", function (next) {
  if (this.name && !this.slug) {
    const base = this.name.toLowerCase().trim().replace(/\s+/g, "-");
    const suffix = Math.random().toString(36).substring(2, 7);
    this.slug = `${base}-${suffix}`;
  }
  next();
});

// Index for search + filtering performance
productSchema.index({ name: "text", description: "text" });
productSchema.index({ category: 1, isActive: 1 });

module.exports = mongoose.model("Product", productSchema);
