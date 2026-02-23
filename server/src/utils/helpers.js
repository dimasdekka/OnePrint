/**
 * Helper Utilities
 * Common helper functions used across the application
 */

/**
 * Generate unique order ID for Midtrans
 * Format: ORD-{timestamp}-{random}
 * Max 50 characters for Midtrans
 */
const generateOrderId = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `ORD-${timestamp}-${random}`;
};

/**
 * Calculate total amount with tax
 * @param {number} subtotal - Subtotal amount
 * @param {number} taxRate - Tax rate (e.g., 0.007 for 0.7%)
 * @returns {Object} { subtotal, taxAmount, total }
 */
const calculateTotalWithTax = (subtotal, taxRate) => {
  const taxAmount = Math.ceil(subtotal * taxRate);
  const total = subtotal + taxAmount;

  return {
    subtotal,
    taxAmount,
    total,
  };
};

/**
 * Check if session is expired
 * @param {Date} expiresAt - Expiration date
 * @returns {boolean}
 */
const isSessionExpired = (expiresAt) => {
  return new Date() > new Date(expiresAt);
};

/**
 * Format date to readable string
 * @param {Date} date
 * @returns {string}
 */
const formatDateTime = (date) => {
  const d = new Date(date);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
};

/**
 * Sanitize filename to prevent path traversal
 * @param {string} filename
 * @returns {string}
 */
const sanitizeFilename = (filename) => {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_");
};

module.exports = {
  generateOrderId,
  calculateTotalWithTax,
  isSessionExpired,
  formatDateTime,
  sanitizeFilename,
};
