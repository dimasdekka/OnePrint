const { prisma } = require("../config/database");
const { snap } = require("../config/midtrans");
const {
  PRICE_PER_PAGE,
  TAX_RATE_QRIS,
  TRANSACTION_STATUS,
} = require("../utils/constants");
const { generateOrderId, calculateTotalWithTax } = require("../utils/helpers");
const logger = require("../utils/logger");

/**
 * Retry helper for transient network errors (like ECONNRESET)
 */
const withRetry = async (fn, maxRetries = 3, delay = 1000) => {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) throw error;
      logger.warn(`Midtrans API request failed, retrying (${attempt}/${maxRetries})...`, { error: error.message });
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
};

/**
 * Payment Service
 * Handles payment-related business logic
 */

/**
 * Get pricing for print job from PrinterSettings
 * @param {string} printerId - Printer ID
 * @param {string} colorMode - 'bw' or 'color'
 * @returns {Promise<number>} Price per page
 */
const getPricePerPage = async (printerId, colorMode = "bw") => {
  // If no specific printer, get default from any printer settings
  const settings = printerId
    ? await prisma.printerSettings.findUnique({
        where: { printerId },
      })
    : await prisma.printerSettings.findFirst();

  if (!settings) {
    // Fallback to constant if no printer settings found
    return colorMode === "color" ? PRICE_PER_PAGE * 2 : PRICE_PER_PAGE;
  }

  return colorMode === "color"
    ? Number(settings.pricePerPageColor)
    : Number(settings.pricePerPageBw);
};

/**
 * Calculate payment amount with color mode
 * @param {number} pageCount - Number of pages
 * @param {number} copies - Number of copies
 * @param {string} colorMode - 'bw' or 'color'
 * @param {string} printerId - Printer ID (optional)
 * @returns {Promise<Object>} Amount breakdown
 */
const calculateAmount = async (
  pageCount,
  copies = 1,
  colorMode = "bw",
  printerId = null,
) => {
  const pricePerPage = await getPricePerPage(printerId, colorMode);
  const subtotal = pageCount * copies * pricePerPage;
  return calculateTotalWithTax(subtotal, TAX_RATE_QRIS);
};

/**
 * Create transaction record in database
 * @param {string} sessionId - Session ID
 * @param {string} orderId - Order ID
 * @param {number} amount - Total amount
 * @param {string} midtransToken - Midtrans token
 * @param {string} printerId - Printer ID (optional)
 * @returns {Promise<Object>} Created transaction
 */
const createTransaction = async (
  sessionId,
  orderId,
  amount,
  midtransToken = null,
  printerId = null,
) => {
  const transaction = await prisma.transaction.create({
    data: {
      sessionId,
      orderId,
      amount,
      midtransToken,
      printerId,
      paymentStatus: "pending",
    },
  });

  logger.info("Transaction created", {
    sessionId,
    orderId,
    amount,
    printerId,
  });

  return transaction;
};

/**
 * Create Midtrans payment token
 * @param {string} sessionId - Session ID
 * @param {string} filename - File name
 * @param {Object} printJobData - Print job details {printerId, pageCount, copies, colorMode}
 * @returns {Promise<Object>} Midtrans token and redirect URL
 */
const createMidtransToken = async (sessionId, filename, printJobData = {}) => {
  const orderId = generateOrderId();
  const {
    printerId = null,
    pageCount = 1,
    copies = 1,
    colorMode = "bw",
    amount = null,
  } = printJobData;

  // Calculate amount dynamically from printer settings if not provided
  let subtotal = amount;
  if (!amount) {
    const pricePerPage = await getPricePerPage(printerId, colorMode);
    subtotal = pageCount * copies * pricePerPage;
  }

  const { taxAmount, total } = calculateTotalWithTax(subtotal, TAX_RATE_QRIS);

  // Create Midtrans transaction
  const parameter = {
    transaction_details: {
      order_id: orderId,
      gross_amount: total,
    },
    credit_card: { secure: true },
    customer_details: {
      first_name: "OnePrint",
      last_name: "User",
    },
    callbacks: {
      finish: process.env.CLIENT_URL || "http://localhost:3000",
      error: process.env.CLIENT_URL || "http://localhost:3000",
      close: process.env.CLIENT_URL || "http://localhost:3000",
    },
    enabled_payments: ["other_qris"],
    item_details: [
      {
        id: "PRINT",
        price: subtotal,
        quantity: 1,
        name: `Printing Services (${pageCount} pages x ${copies} copies, ${colorMode === "color" ? "Color" : "B&W"})`,
      },
      {
        id: "TAX-QRIS",
        price: taxAmount,
        quantity: 1,
        name: "QRIS Tax (0.7%)",
      },
    ],
  };

  // Wrap in retry to handle Midtrans ECONNRESET issues
  const transaction = await withRetry(
    () => snap.createTransaction(parameter),
    3,    // max attempts
    1000, // 1s -> 2s -> 3s backoff
  );

  // Create transaction in DB with midtransToken and printer reference
  await createTransaction(
    sessionId,
    orderId,
    total,
    transaction.token,
    printerId,
  );

  logger.info("Midtrans token created", {
    sessionId,
    orderId,
    total,
    pageCount,
    copies,
    colorMode,
    printerId,
  });

  return {
    token: transaction.token,
    redirect_url: transaction.redirect_url,
    orderId,
  };
};

/**
 * Process payment completion
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object>} Processing result
 */
const processPayment = async (sessionId) => {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { file: true },
  });

  if (!session || !session.file?.filename) {
    throw new Error("Session invalid or no file to print");
  }

  logger.info("Payment processed successfully", { sessionId });

  return {
    sessionId,
    fileName: session.file.filename,
    pageCount: session.file?.totalPages || session.pageCount || 1,
  };
};

/**
 * Update transaction payment status
 * @param {string} orderId - Order ID
 * @param {string} paymentStatus - New payment status (pending, paid, failed, expired)
 * @returns {Promise<Object>} Updated transaction
 */
const updateTransactionStatus = async (orderId, paymentStatus) => {
  const updateData = {
    paymentStatus,
  };

  // Set paidAt timestamp if payment is successful
  if (paymentStatus === "paid") {
    updateData.paidAt = new Date();
  }

  const transaction = await prisma.transaction.update({
    where: { orderId },
    data: updateData,
  });

  logger.info("Transaction status updated", { orderId, paymentStatus });
  return transaction;
};

/**
 * Mark transaction as paid (legacy support)
 * @param {string} orderId - Order ID
 * @returns {Promise<Object>} Updated transaction
 */
const markTransactionAsPaid = async (orderId) => {
  return await updateTransactionStatus(orderId, "paid");
};

module.exports = {
  getPricePerPage,
  calculateAmount,
  createTransaction,
  createMidtransToken,
  processPayment,
  updateTransactionStatus,
  markTransactionAsPaid,
};
