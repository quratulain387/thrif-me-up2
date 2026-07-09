// middleware/uploadMiddleware.js
// Handles product image AND video uploads from the Admin Panel using
// multer. Files are held in memory (not written to local disk) and
// then streamed directly to Cloudinary in uploadRoutes.js.

const multer = require("multer");

// Separate instance for photos (JPG/PNG/WEBP, up to 5MB each)
const imageFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  if (allowed.test(file.mimetype)) cb(null, true);
  else cb(new Error("Only .jpg, .png, and .webp image files are allowed"));
};

const uploadImages = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max per image
});

// Separate instance for a single short product video (MP4/WEBM/MOV, up to 30MB)
const videoFilter = (req, file, cb) => {
  const allowed = /mp4|webm|quicktime|mov/;
  if (allowed.test(file.mimetype)) cb(null, true);
  else cb(new Error("Only .mp4, .webm, and .mov video files are allowed"));
};

const uploadVideo = multer({
  storage: multer.memoryStorage(),
  fileFilter: videoFilter,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB max — keep clips short
});

module.exports = { uploadImages, uploadVideo };
