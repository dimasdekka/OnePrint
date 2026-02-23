const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");
const { validatePaymentToken } = require("../middleware/validator");

/**
 * Payment Routes
 */

// Generate Midtrans payment token
router.post("/token", validatePaymentToken, paymentController.generateToken);

// Midtrans notification webhook
router.post("/notification", paymentController.handleNotification);

// Complete payment and start printing
router.post("/complete", paymentController.completePayment);

module.exports = router;
