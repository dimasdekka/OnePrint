const multer = require("multer");
const path = require("path");
const fs = require("fs");

const UPLOAD_DIR = "uploads";

/**
 * Ensure upload directory exists
 */
const ensureUploadDir = () => {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    console.log(`Created upload directory: ${UPLOAD_DIR}`);
  }
};

/**
 * Multer storage configuration
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureUploadDir();
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  },
});

/**
 * File filter for allowed types
 */
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(
      new Error("Hanya file PDF yang diizinkan. Silakan upload file PDF."),
      false,
    );
  }
};

/**
 * Multer upload configuration
 */
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

module.exports = { upload, UPLOAD_DIR };
