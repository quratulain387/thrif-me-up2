// config/db.js
// Handles connecting to MongoDB Atlas via Mongoose.
// Keeps connection logic separate from server.js (MVC: config layer).

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Exit process with failure — no point running server without a DB
    process.exit(1);
  }
};

module.exports = connectDB;
