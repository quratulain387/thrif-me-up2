// controllers/contactController.js

const asyncHandler = require("../middleware/asyncHandler");
const ContactMessage = require("../models/ContactMessage");
const Newsletter = require("../models/Newsletter");

// @desc    Submit a contact form message
// @route   POST /api/contact
// @access  Public
const sendContactMessage = asyncHandler(async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    res.status(400);
    throw new Error("Name, email, and message are all required");
  }

  const contactMessage = await ContactMessage.create({ name, email, message });
  res.status(201).json({ success: true, message: "Message sent! We'll reply within 24 hours.", contactMessage });
});

// @desc    Subscribe to the newsletter
// @route   POST /api/newsletter
// @access  Public
const subscribeNewsletter = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error("Email is required");
  }

  const existing = await Newsletter.findOne({ email });
  if (existing) {
    if (existing.isActive) {
      return res.json({ success: true, message: "You're already subscribed!" });
    }
    existing.isActive = true;
    await existing.save();
    return res.json({ success: true, message: "Welcome back! You're re-subscribed." });
  }

  await Newsletter.create({ email });
  res.status(201).json({ success: true, message: "Subscribed! Watch your inbox for new drops." });
});

// @desc    Get all contact messages (admin)
// @route   GET /api/contact
// @access  Private/Admin
const getContactMessages = asyncHandler(async (req, res) => {
  const messages = await ContactMessage.find().sort("-createdAt");
  res.json({ success: true, count: messages.length, messages });
});

// @desc    Mark a contact message as read (admin)
// @route   PUT /api/contact/:id/read
// @access  Private/Admin
const markMessageRead = asyncHandler(async (req, res) => {
  const message = await ContactMessage.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
  if (!message) {
    res.status(404);
    throw new Error("Message not found");
  }
  res.json({ success: true, message });
});

// @desc    Get all newsletter subscribers (admin)
// @route   GET /api/newsletter
// @access  Private/Admin
const getSubscribers = asyncHandler(async (req, res) => {
  const subscribers = await Newsletter.find({ isActive: true }).sort("-createdAt");
  res.json({ success: true, count: subscribers.length, subscribers });
});

module.exports = {
  sendContactMessage,
  subscribeNewsletter,
  getContactMessages,
  markMessageRead,
  getSubscribers,
};
