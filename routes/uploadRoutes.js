// routes/uploadRoutes.js
// Lets the Admin Panel upload real product photos AND a short product
// video, streaming both straight to Cloudinary (no local disk storage,
// so files survive redeploys on hosting platforms with an ephemeral
// filesystem).

const express = require("express");
const router = express.Router();
const { uploadImages, uploadVideo } = require("../middleware/uploadMiddleware");
const { protect, admin } = require("../middleware/authMiddleware");
const asyncHandler = require("../middleware/asyncHandler");
const cloudinary = require("../config/cloudinary");

// Wraps Cloudinary's stream-based upload API in a Promise so we can
// use it with async/await like any other call.
function uploadBufferToCloudinary(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
    stream.end(buffer);
  });
}

// @desc    Upload one or more product images
// @route   POST /api/upload
// @access  Private/Admin
router.post(
  "/",
  protect,
  admin,
  uploadImages.array("images", 6),
  asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
      res.status(400);
      throw new Error("No files uploaded");
    }

    const uploadResults = await Promise.all(
      req.files.map((file) =>
        uploadBufferToCloudinary(file.buffer, {
          folder: "thrifmeup/products",
          transformation: [{ width: 1200, height: 1500, crop: "limit" }],
        })
      )
    );
    const paths = uploadResults.map((r) => r.secure_url);

    res.status(201).json({ success: true, paths });
  })
);

// @desc    Upload a single short product video
// @route   POST /api/upload/video
// @access  Private/Admin
router.post(
  "/video",
  protect,
  admin,
  uploadVideo.single("video"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      res.status(400);
      throw new Error("No video uploaded");
    }

    const result = await uploadBufferToCloudinary(req.file.buffer, {
      folder: "thrifmeup/videos",
      resource_type: "video",
      transformation: [{ width: 1280, crop: "limit" }],
    });

    res.status(201).json({ success: true, path: result.secure_url });
  })
);

module.exports = router;
