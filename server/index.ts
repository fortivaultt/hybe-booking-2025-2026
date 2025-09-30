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
// Database health endpoints (dynamic)
const getDatabaseHealth: any = async (req: any, res: any) => {
  try {
    const health = await db.healthCheck();
    res.json({
      database: dbType === "supabase" ? "Supabase" : "SQLite",
      status: health.connected ? "connected" : "disconnected",
      totalSubscriptions: health.totalSubscriptions,
      totalBookings: health.totalBookings,
      error: health.error,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      database: dbType === "supabase" ? "Supabase" : "SQLite",
      status: "error",
      error: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
};
import { initializeCache } from "./utils/cache";
import { db, dbType } from "./utils/db-provider";
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

  // Initialize database (Supabase preferred when configured)
  try {
    const initialized = await db.initialize();
    if (initialized) {
      console.info(
        `✓ ${dbType === "supabase" ? "Supabase" : "SQLite"} database initialized successfully`,
      );
    } else {
      console.warn(
        `⚠ ${dbType === "supabase" ? "Supabase" : "SQLite"} database initialization failed (or tables missing)`,
      );
    }
  } catch (error) {
    console.warn("⚠ Database initialization error:", error);
  }

  // Trust proxy for accurate IP addresses
  app.set("trust proxy", 1);

  // Enforce HTTPS in production when FORCE_HTTPS=true
  const shouldForceHttps =
    process.env.NODE_ENV === "production" &&
    String(process.env.FORCE_HTTPS).toLowerCase() === "true";

  if (shouldForceHttps) {
    // HSTS for 1 year incl. subdomains
    app.use((_, res, next) => {
      res.setHeader(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains; preload",
      );
      next();
    });

    app.use((req, res, next) => {
      const forwardedProto = String(
        (req.headers["x-forwarded-proto"] as string) || "",
      )
        .split(",")[0]
        .trim();

      if (forwardedProto && forwardedProto !== "https") {
        const host =
          (req.headers["x-forwarded-host"] as string) || req.headers.host;
        const target = `https://${host}${req.originalUrl}`;
        if (req.method === "GET" || req.method === "HEAD") {
          return res.redirect(308, target);
        }
        return res.status(400).send("Please use HTTPS.");
      }
      next();
    });
  }

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
