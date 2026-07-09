// config/cloudinary.js
// Reads CLOUDINARY_URL from .env automatically (the SDK detects
// this specific env var name without extra config).

const cloudinary = require("cloudinary").v2;

module.exports = cloudinary;
