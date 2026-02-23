const express = require("express");
const router = express.Router();
const uploadController = require("../controllers/upload.controller");
const { upload } = require("../config/multer");
const { validateFileUpload } = require("../middleware/validator");

/**
 * Upload Routes
 */

// File upload endpoint
router.post(
  "/upload",
  upload.single("file"),
  validateFileUpload,
  uploadController.uploadFile,
);

module.exports = router;
