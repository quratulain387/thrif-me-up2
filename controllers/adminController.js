// controllers/adminController.js
// Aggregates numbers for the Admin Dashboard overview screen.

const asyncHandler = require("../middleware/asyncHandler");
const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");
const ContactMessage = require("../models/ContactMessage");

// @desc    Get dashboard overview stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getDashboardStats = asyncHandler(async (req, res) => {
  const [totalProducts, activeProducts, totalOrders, totalCustomers, unreadMessages, revenueAgg, recentOrders] =
    await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments(),
      User.countDocuments({ role: "customer" }),
      ContactMessage.countDocuments({ isRead: false }),
      Order.aggregate([
        { $match: { status: { $ne: "Cancelled" } } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      ]),
      Order.find().populate("user", "name").sort("-createdAt").limit(5),
    ]);

  res.json({
    success: true,
    stats: {
      totalProducts,
      activeProducts,
      soldOutProducts: totalProducts - activeProducts,
      totalOrders,
      totalCustomers,
      unreadMessages,
      totalRevenue: revenueAgg[0]?.total || 0,
    },
    recentOrders,
  });
});

module.exports = { getDashboardStats };
