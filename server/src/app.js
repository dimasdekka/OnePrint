require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const path = require("path");
const { UPLOAD_DIR } = require("./config/multer");
const { validateMidtransConfig } = require("./config/midtrans");
const routes = require("./routes");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");
const logger = require("./utils/logger");

/**
 * Express Application Setup
 */

const app = express();

// Validate environment configuration
try {
  validateMidtransConfig();
  logger.info("Environment configuration validated");
} catch (error) {
  logger.warn("Midtrans configuration warning", { error: error.message });
}

// Middleware
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin)
        return callback(
          null,
          process.env.CLIENT_URL || "http://localhost:3000",
        );
      return callback(null, origin);
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || "oneprint-secret-key-!@#$%",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }),
);

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "..", UPLOAD_DIR)));

// Request logging middleware (development only)
if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    logger.debug(`${req.method} ${req.path}`, {
      query: req.query,
      body: req.body,
    });
    next();
  });
}

// Mount routes
app.use(routes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;
