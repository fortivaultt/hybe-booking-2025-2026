import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleBookingSubmission } from "./routes/booking";
import {
  validateSubscriptionId,
  listSubscriptionTypes,
} from "./routes/subscription";
import { handleSendOtp, handleVerifyOtp } from "./routes/otp";
import {
  getSystemHealth,
  getAnalyticsDashboard,
  getRealTimeMetrics,
} from "./routes/monitoring";
import {
  getDatabaseHealth,
  getDatabaseConnectionInfo,
  testDatabaseConnection,
} from "./routes/database-health";
import { initializeCache } from "./utils/cache";
import { initializeDatabase, checkDatabaseSchema } from "./utils/db-init";
import { requestLogger, Analytics } from "./utils/logger";
import {
  generalRateLimit,
  subscriptionValidationRateLimit,
  otpRateLimit,
  bookingSubmissionRateLimit,
} from "./middleware/rateLimiter";
import {
  errorTrackingMiddleware,
  errorTrackingHealthCheck,
} from "./middleware/errorTracking";

export async function createServer() {
  const app = express();

  // Initialize SQLite cache
  try {
    await initializeCache();
    console.info("✓ SQLite cache initialized successfully");
  } catch (error) {
    console.warn(
      "⚠ SQLite cache initialization failed, continuing without cache:",
      error,
    );
  }

  // Initialize database schema (if connected)
  try {
    const schemaCheck = await checkDatabaseSchema();
    if (!schemaCheck.valid && schemaCheck.missingTables?.length) {
      console.info(`🔄 Missing tables detected: ${schemaCheck.missingTables.join(', ')}`);
      const initialized = await initializeDatabase();
      if (initialized) {
        console.info("✓ Database schema initialized successfully");
      } else {
        console.warn("⚠ Database schema initialization failed, but continuing...");
      }
    } else if (schemaCheck.valid) {
      console.info("✓ Database schema is up to date");
    } else {
      console.warn("⚠ Database schema check failed:", schemaCheck.error);
    }
  } catch (error) {
    console.warn(
      "⚠ Database initialization skipped (database may be unavailable):",
      error
    );
  }

  // Trust proxy for accurate IP addresses
  app.set("trust proxy", 1);

  // Core middleware
  app.use(cors());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.use(requestLogger);

  // Apply general rate limiting to all API routes
  if (!process.env.VITEST) {
    app.use("/api", generalRateLimit.middleware());
  }

  // Health check endpoints (no rate limiting)
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  // Health check and monitoring endpoints
  app.get("/api/health/error-tracking", errorTrackingHealthCheck);
  app.get("/api/health/system", getSystemHealth);
  app.get("/api/health/database", getDatabaseHealth);
  app.get("/api/health/database/connection", getDatabaseConnectionInfo);
  app.post("/api/health/database/test", testDatabaseConnection);
  app.get("/api/monitoring/dashboard", getAnalyticsDashboard);
  app.get("/api/monitoring/metrics", getRealTimeMetrics);

  // Demo route
  app.get("/api/demo", handleDemo);

  // Booking submission with specific rate limiting
  app.post(
    "/api/booking",
    bookingSubmissionRateLimit.middleware(),
    (req, res, next) => {
      Analytics.trackFormProgress("booking_submission_attempt", req.ip);
      next();
    },
    handleBookingSubmission,
  );

  // Subscription validation with specific rate limiting
  app.post(
    "/api/subscription/validate",
    subscriptionValidationRateLimit.middleware(),
    validateSubscriptionId,
  );

  app.get("/api/subscription/types", listSubscriptionTypes);

  // OTP routes with specific rate limiting
  if (!process.env.VITEST) {
    app.post(
      "/api/otp/send",
      otpRateLimit.middleware(),
      (req, res, next) => {
        Analytics.trackFormProgress("otp_request", req.ip);
        next();
      },
      handleSendOtp,
    );

    app.post("/api/otp/verify", otpRateLimit.middleware(), handleVerifyOtp);
  } else {
    app.post("/api/otp/send", handleSendOtp);
    app.post("/api/otp/verify", handleVerifyOtp);
  }

  // Enhanced error handling middleware
  app.use(errorTrackingMiddleware);

  return app;
}
