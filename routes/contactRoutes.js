// routes/contactRoutes.js

const express = require("express");
const router = express.Router();
const {
  sendContactMessage,
  subscribeNewsletter,
  getContactMessages,
  markMessageRead,
  getSubscribers,
} = require("../controllers/contactController");
const { protect, admin } = require("../middleware/authMiddleware");

router.post("/contact", sendContactMessage);
router.post("/newsletter", subscribeNewsletter);

router.get("/contact", protect, admin, getContactMessages);
router.put("/contact/:id/read", protect, admin, markMessageRead);
router.get("/newsletter", protect, admin, getSubscribers);

module.exports = router;
