// routes/testimonialRoutes.js

const express = require("express");
const router = express.Router();
const {
  getApprovedTestimonials,
  getAllTestimonials,
  createTestimonial,
  setTestimonialApproval,
  deleteTestimonial,
} = require("../controllers/testimonialController");
const { protect, admin } = require("../middleware/authMiddleware");

router.get("/", getApprovedTestimonials);
router.get("/all", protect, admin, getAllTestimonials);
router.post("/", protect, admin, createTestimonial);
router.put("/:id/approve", protect, admin, setTestimonialApproval);
router.delete("/:id", protect, admin, deleteTestimonial);

module.exports = router;
