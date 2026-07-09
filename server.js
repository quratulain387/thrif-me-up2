// server.js
// Main entry point — boots the Express app, connects DB, mounts routes.

const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

// Load environment variables from .env
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// ---------- Core Middleware ----------
app.use(express.json()); // parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // parse form bodies
app.use(cookieParser()); // read JWT from cookies
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5000",
    credentials: true,
  })
);

// Log requests to console in development only
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// ---------- Static Frontend ----------
// Serves HTML/CSS/JS pages from /public (built in Phase 3)
app.use(express.static(path.join(__dirname, "public")));

// ---------- API Routes ----------
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/categories", require("./routes/categoryRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api", require("./routes/contactRoutes"));
app.use("/api/upload", require("./routes/uploadRoutes"));
app.use("/api/testimonials", require("./routes/testimonialRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

// Simple health check route to confirm server is alive
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Thrif Me Up API is running" });
});

// ---------- Error Handling (must be last) ----------
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
});
