// controllers/testimonialController.js

const asyncHandler = require("../middleware/asyncHandler");
const Testimonial = require("../models/Testimonial");

// @desc    Get approved testimonials (for homepage display)
// @route   GET /api/testimonials
// @access  Public
const getApprovedTestimonials = asyncHandler(async (req, res) => {
  const testimonials = await Testimonial.find({ isApproved: true }).sort("-createdAt").limit(9);
  res.json({ success: true, testimonials });
});

// @desc    Get all testimonials, approved or not (admin)
// @route   GET /api/testimonials/all
// @access  Private/Admin
const getAllTestimonials = asyncHandler(async (req, res) => {
  const testimonials = await Testimonial.find().sort("-createdAt");
  res.json({ success: true, testimonials });
});

// @desc    Admin manually adds a testimonial (e.g. from a WhatsApp/Instagram review)
// @route   POST /api/testimonials
// @access  Private/Admin
const createTestimonial = asyncHandler(async (req, res) => {
  const { name, city, rating, message, isApproved } = req.body;
  if (!name || !rating || !message) {
    res.status(400);
    throw new Error("Name, rating, and message are required");
  }
  const testimonial = await Testimonial.create({ name, city, rating, message, isApproved: !!isApproved });
  res.status(201).json({ success: true, testimonial });
});

// @desc    Approve or unapprove a testimonial
// @route   PUT /api/testimonials/:id/approve
// @access  Private/Admin
const setTestimonialApproval = asyncHandler(async (req, res) => {
  const testimonial = await Testimonial.findByIdAndUpdate(
    req.params.id,
    { isApproved: req.body.isApproved },
    { new: true }
  );
  if (!testimonial) {
    res.status(404);
    throw new Error("Testimonial not found");
  }
  res.json({ success: true, testimonial });
});

// @desc    Delete a testimonial
// @route   DELETE /api/testimonials/:id
// @access  Private/Admin
const deleteTestimonial = asyncHandler(async (req, res) => {
  const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
  if (!testimonial) {
    res.status(404);
    throw new Error("Testimonial not found");
  }
  res.json({ success: true, message: "Testimonial deleted" });
});

module.exports = {
  getApprovedTestimonials,
  getAllTestimonials,
  createTestimonial,
  setTestimonialApproval,
  deleteTestimonial,
};
