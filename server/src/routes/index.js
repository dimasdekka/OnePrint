const express = require("express");
const router = express.Router();

// Import route modules
const authRoutes = require("./auth.routes");
const sessionRoutes = require("./session.routes");
const uploadRoutes = require("./upload.routes");
const paymentRoutes = require("./payment.routes");
const adminRoutes = require("./admin.routes");

/**
 * Main Router
 * Combines all route modules
 */

// Health check
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "OnePrint Server is running",
    version: "2.0.0",
  });
});

// Mount route modules
router.use("/api", authRoutes);
router.use("/api", sessionRoutes);
router.use("/api", uploadRoutes);
router.use("/api/order", paymentRoutes);
router.use("/api", adminRoutes);

module.exports = router;
