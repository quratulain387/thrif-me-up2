// controllers/orderController.js

const asyncHandler = require("../middleware/asyncHandler");
const Order = require("../models/Order");
const Product = require("../models/Product");

// @desc    Create a new order from the cart
// @route   POST /api/orders
// @access  Private
const createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, paymentMethod } = req.body;

  if (!items || items.length === 0) {
    res.status(400);
    throw new Error("No items in order");
  }
  if (!shippingAddress?.fullName || !shippingAddress?.phone || !shippingAddress?.street || !shippingAddress?.city) {
    res.status(400);
    throw new Error("Complete shipping address is required");
  }

  // Re-verify prices/availability server-side rather than trusting the client cart
  const verifiedItems = [];
  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product || !product.isActive) {
      res.status(400);
      throw new Error(`"${item.name}" is no longer available`);
    }
    verifiedItems.push({
      product: product._id,
      name: product.name,
      image: product.images[0],
      price: product.price,
      size: product.size,
      quantity: item.quantity,
    });
  }

  const itemsPrice = verifiedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shippingPrice = 250; // flat nationwide rate
  const totalPrice = itemsPrice + shippingPrice;

  const order = await Order.create({
    user: req.user._id,
    items: verifiedItems,
    shippingAddress,
    paymentMethod: paymentMethod || "Bank Transfer",
    itemsPrice,
    shippingPrice,
    totalPrice,
  });

  // Mark one-of-one items as sold out so they drop out of the shop
  for (const item of verifiedItems) {
    await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
    const updated = await Product.findById(item.product);
    if (updated.stock <= 0) {
      updated.isActive = false;
      await updated.save();
    }
  }

  res.status(201).json({ success: true, order });
});

// @desc    Get the logged-in user's own orders
// @route   GET /api/orders/my-orders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort("-createdAt");
  res.json({ success: true, count: orders.length, orders });
});

// @desc    Get a single order by ID (owner or admin only)
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate("user", "name email");

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  const isOwner = order.user._id.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Not authorized to view this order");
  }

  res.json({ success: true, order });
});

// @desc    Get all orders (admin)
// @route   GET /api/orders
// @access  Private/Admin
const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find().populate("user", "name email").sort("-createdAt");
  res.json({ success: true, count: orders.length, orders });
});

// @desc    Update order status (admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  order.status = req.body.status || order.status;
  if (req.body.status === "Delivered") order.deliveredAt = new Date();
  await order.save();
  res.json({ success: true, order });
});

module.exports = { createOrder, getMyOrders, getOrderById, getAllOrders, updateOrderStatus };
