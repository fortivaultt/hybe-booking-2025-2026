import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleBookingSubmission } from "./routes/booking";
import { validateSubscriptionId, listSubscriptionTypes } from "./routes/subscription";
import { handleSendOtp, handleVerifyOtp } from "./routes/otp";
import { getSystemHealth, getAnalyticsDashboard, getRealTimeMetrics } from "./routes/monitoring";
import { initializeRedis } from "./utils/cache";
import { requestLogger, Analytics } from "./utils/logger";
import {
  generalRateLimit,
  subscriptionValidationRateLimit,
  otpRateLimit,
  bookingSubmissionRateLimit
} from "./middleware/rateLimiter";
import { errorTrackingMiddleware, errorTrackingHealthCheck } from "./middleware/errorTracking";

export async function createServer() {
  const app = express();

  // Initialize Redis cache
  try {
    await initializeRedis();
    console.info("✓ Redis cache initialized successfully");
  } catch (error) {
    console.warn("⚠ Redis cache initialization failed, continuing without cache:", error);
  }

  // Trust proxy for accurate IP addresses
  app.set('trust proxy', 1);

  // Core middleware
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(requestLogger);

  // Apply general rate limiting to all API routes
  app.use('/api', generalRateLimit.middleware());

  // Health check endpoints (no rate limiting)
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  // Health check and monitoring endpoints
  app.get("/api/health/error-tracking", errorTrackingHealthCheck);
  app.get("/api/health/system", getSystemHealth);
  app.get("/api/monitoring/dashboard", getAnalyticsDashboard);
  app.get("/api/monitoring/metrics", getRealTimeMetrics);

  // Demo route
  app.get("/api/demo", handleDemo);

  // Booking submission with specific rate limiting
  app.post("/api/booking",
    bookingSubmissionRateLimit.middleware(),
    (req, res, next) => {
      Analytics.trackFormProgress('booking_submission_attempt', req.ip);
      next();
    },
    handleBookingSubmission
  );

  // Subscription validation with specific rate limiting
  app.post("/api/subscription/validate",
    subscriptionValidationRateLimit.middleware(),
    validateSubscriptionId
  );

  app.get("/api/subscription/types", listSubscriptionTypes);

  // OTP routes with specific rate limiting
  app.post("/api/otp/send",
    otpRateLimit.middleware(),
    (req, res, next) => {
      Analytics.trackFormProgress('otp_request', req.ip);
      next();
    },
    handleSendOtp
  );

  app.post("/api/otp/verify",
    otpRateLimit.middleware(),
    handleVerifyOtp
  );

  // Enhanced error handling middleware
  app.use(errorTrackingMiddleware);

  return app;
}
