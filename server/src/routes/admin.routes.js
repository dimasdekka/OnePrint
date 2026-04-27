const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const { validatePrinterData } = require("../middleware/validator");
const { authRequired, adminRequired } = require("../middleware/auth");

/**
 * Admin Routes
 * All routes require authentication and admin role
 */

// System printers
router.get(
  "/system/printers",
  authRequired,
  adminRequired,
  adminController.getSystemPrinters,
);

// Managed printers
router.get(
  "/admin/printers",
  adminController.getManagedPrinters,
);
router.post(
  "/admin/printers",
  authRequired,
  adminRequired,
  validatePrinterData,
  adminController.addPrinter,
);
router.delete(
  "/admin/printers/:id",
  authRequired,
  adminRequired,
  adminController.removePrinter,
);
router.post(
  "/admin/printers/:id/test-print",
  authRequired,
  adminRequired,
  adminController.testPrint,
);
router.post(
  "/admin/printers/:id/sync-status",
  authRequired,
  adminRequired,
  adminController.syncPrinterStatus,
);

// Dummy printer for testing
router.post(
  "/admin/dummy-printer",
  authRequired,
  adminRequired,
  adminController.toggleDummyPrinter,
);

// Reports
router.get(
  "/admin/reports",
  authRequired,
  adminRequired,
  adminController.getReports,
);
router.get(
  "/admin/reports/summary",
  authRequired,
  adminRequired,
  adminController.getReportsSummary,
);
router.delete(
  "/admin/reports/:id",
  authRequired,
  adminRequired,
  adminController.deleteReport,
);

// Settings
router.get(
  "/admin/settings",
  adminController.getSettings,
);
router.post(
  "/admin/settings",
  authRequired,
  adminRequired,
  adminController.updateSettings,
);

module.exports = router;
