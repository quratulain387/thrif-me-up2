// utils/seed.js
// Populates the database with demo categories + products so the Shop page
// has real data to display. Run manually with: node utils/seed.js
// Safe to re-run — it clears old demo data first.

const dotenv = require("dotenv");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Category = require("../models/Category");
const Product = require("../models/Product");
const User = require("../models/User");

dotenv.config();

const categories = [
  { name: "Sweaters", description: "Cozy knits and pullovers" },
  { name: "Outerwear", description: "Jackets, bombers, and coats" },
  { name: "Dresses", description: "Vintage and pre-loved dresses" },
  { name: "Home Decor", description: "Ceramics, mugs, and cute finds" },
  { name: "Accessories", description: "Gloves, hats, and more" },
];

const run = async () => {
  await connectDB();

  console.log("Clearing old demo data...");
  await Product.deleteMany({});
  await Category.deleteMany({});

  console.log("Seeding categories...");
  const createdCategories = await Category.insertMany(categories);
  const byName = (name) => createdCategories.find((c) => c.name === name)._id;

  const products = [
    {
      name: "Rust Ribbed Knit Sweater",
      description: "A cozy rust-toned ribbed knit sweater, gently worn and in excellent condition. Perfect for layering.",
      category: byName("Sweaters"),
      price: 1450,
      compareAtPrice: 2800,
      size: "M",
      condition: "Excellent",
      images: ["/images/placeholder-rust-knit.jpg"],
      isFeatured: true,
      isNewArrival: true,
    },
    {
      name: "Mint Striped Pullover",
      description: "Soft mint and sage striped pullover, lightweight and breathable.",
      category: byName("Sweaters"),
      price: 1200,
      size: "S",
      condition: "Very Good",
      images: ["/images/placeholder-mint-stripe.jpg"],
      isFeatured: true,
    },
    {
      name: "Charcoal Floral Print Top",
      description: "Delicate floral print top in deep charcoal, a rare vintage find.",
      category: byName("Dresses"),
      price: 980,
      size: "M",
      condition: "Excellent",
      images: ["/images/placeholder-charcoal-floral.jpg"],
      isFeatured: true,
    },
    {
      name: "Mustard Knit Gloves",
      description: "Hand-knit mustard gloves, warm and cozy for winter.",
      category: byName("Accessories"),
      price: 650,
      size: "One Size",
      condition: "New with tags",
      images: ["/images/placeholder-mustard.jpg"],
      isFeatured: true,
    },
    {
      name: "Forest Green Striped Knit",
      description: "Deep forest green striped knit sweater, a versatile everyday piece.",
      category: byName("Sweaters"),
      price: 1600,
      size: "L",
      condition: "Excellent",
      images: ["/images/placeholder-forest.jpg"],
      isNewArrival: true,
    },
    {
      name: "Pink Checkerboard Sweater",
      description: "Bold pink and black checkerboard pattern sweater, a real statement piece.",
      category: byName("Sweaters"),
      price: 1750,
      size: "M",
      condition: "Very Good",
      images: ["/images/placeholder-checker.jpg"],
      isNewArrival: true,
    },
    {
      name: "Silver Grey Bomber Jacket",
      description: "Sleek silver-grey bomber jacket, lightly worn with a smooth finish.",
      category: byName("Outerwear"),
      price: 2400,
      size: "M",
      condition: "Excellent",
      images: ["/images/placeholder-denim.jpg"],
      isNewArrival: true,
    },
    {
      name: "Coral Crewneck Sweater",
      description: "Bright coral crewneck, a pop of color for any wardrobe.",
      category: byName("Sweaters"),
      price: 1350,
      size: "S",
      condition: "Good",
      images: ["/images/placeholder-blush.jpg"],
      isNewArrival: true,
    },
    {
      name: "Classic Black & Cream Stripe Sweater",
      description: "Timeless black and cream striped sweater, our most-loved bestseller.",
      category: byName("Sweaters"),
      price: 1500,
      size: "M",
      condition: "Excellent",
      images: ["/images/placeholder-sweater-stripe.jpg"],
      isBestSeller: true,
    },
    {
      name: "Handmade Ceramic Plate",
      description: "Artisan handmade ceramic plate, cream glaze finish.",
      category: byName("Home Decor"),
      price: 850,
      size: "One Size",
      condition: "New with tags",
      images: ["/images/placeholder-cream-plain.jpg"],
      isBestSeller: true,
    },
    {
      name: "Terracotta Mug Set",
      description: "Set of 2 terracotta mugs, perfect for chai lovers.",
      category: byName("Home Decor"),
      price: 700,
      size: "One Size",
      condition: "New with tags",
      images: ["/images/placeholder-rust-knit.jpg"],
      isBestSeller: true,
    },
    {
      name: "Mustard Wool Gloves",
      description: "Warm mustard wool gloves, one of our most-repurchased accessories.",
      category: byName("Accessories"),
      price: 650,
      size: "One Size",
      condition: "Very Good",
      images: ["/images/placeholder-mustard.jpg"],
      isBestSeller: true,
    },
  ];

  console.log("Seeding products...");
  await Product.insertMany(products);

  console.log(`Done: ${createdCategories.length} categories, ${products.length} products.`);

  console.log("Setting up admin account...");
  const adminEmail = "admin@thriftmeup.pk";
  const existingAdmin = await User.findOne({ email: adminEmail }).select("+password");
  if (!existingAdmin) {
    await User.create({
      name: "Admin",
      email: adminEmail,
      password: "Admin@123",
      role: "admin",
    });
    console.log(`Admin account created — email: ${adminEmail} | password: Admin@123`);
  } else {
    // Account already existed (e.g. from an earlier test or a normal signup
    // that used this email) — force it back to known-good admin credentials
    // so the documented login always works.
    existingAdmin.password = "Admin@123"; // pre-save hook re-hashes this
    existingAdmin.role = "admin";
    existingAdmin.isActive = true;
    await existingAdmin.save();
    console.log(`Admin account already existed — password & role reset. Email: ${adminEmail} | password: Admin@123`);
  }

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
