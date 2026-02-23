const fs = require("fs");
const pdfParse = require("pdf-parse");
const logger = require("../utils/logger");

/**
 * PDF Service
 * Handles PDF file operations
 */

/**
 * Detect page count from PDF file
 * @param {string} filePath - Path to PDF file
 * @returns {Promise<number>} Number of pages
 */
const detectPageCount = async (filePath) => {
  try {
    logger.debug("Parsing PDF file", { filePath });

    const dataBuffer = fs.readFileSync(filePath);
    logger.debug("PDF buffer loaded", { size: dataBuffer.length });

    const data = await pdfParse(dataBuffer);
    logger.info("PDF parsed successfully", {
      pages: data.numpages,
      filePath,
    });

    return data.numpages;
  } catch (error) {
    logger.error("PDF parsing failed", {
      error: error.message,
      filePath,
    });
    // Return 1 as default if parsing fails
    return 1;
  }
};

/**
 * Get page count based on file type
 * @param {Object} file - Multer file object
 * @returns {Promise<number>} Number of pages
 */
const getPageCount = async (file) => {
  if (file.mimetype === "application/pdf") {
    return await detectPageCount(file.path);
  }

  // For images and other files, default to 1 page
  return 1;
};

module.exports = {
  detectPageCount,
  getPageCount,
};
