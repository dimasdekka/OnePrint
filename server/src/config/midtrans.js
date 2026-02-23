const midtransClient = require("midtrans-client");

/**
 * Midtrans Snap Client Configuration
 */
const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true" || false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

/**
 * Validate Midtrans configuration
 */
const validateMidtransConfig = () => {
  if (!process.env.MIDTRANS_SERVER_KEY || !process.env.MIDTRANS_CLIENT_KEY) {
    throw new Error(
      "Midtrans configuration is missing. Please check MIDTRANS_SERVER_KEY and MIDTRANS_CLIENT_KEY in .env",
    );
  }
};

module.exports = { snap, validateMidtransConfig };
