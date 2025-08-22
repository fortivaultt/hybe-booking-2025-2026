import { createLogger, format, transports } from "winston";

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

// Create custom format
const customFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  format.colorize({ all: true }),
  format.printf((info) => {
    return `${info.timestamp} ${info.level}: ${info.message}`;
  }),
);

const productionFormat = format.combine(
  format.timestamp(),
  format.errors({ stack: true }),
  format.json(),
);

// Create the logger
export const logger = createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  levels,
  format:
    process.env.NODE_ENV === "production" ? productionFormat : customFormat,
  transports: [
    new transports.Console(),
    // In production, you might want to add file transports
    ...(process.env.NODE_ENV === "production"
      ? [
          new transports.File({ filename: "logs/error.log", level: "error" }),
          new transports.File({ filename: "logs/combined.log" }),
        ]
      : []),
  ],
});

// Analytics and metrics tracking
export class Analytics {
  static trackSubscriptionValidation(
    subscriptionId: string,
    isValid: boolean,
    duration: number,
    ip?: string,
  ) {
    logger.info("Subscription validation attempt", {
      event: "subscription_validation",
      subscriptionId: subscriptionId.substring(0, 3) + "***", // Partial ID for privacy
      isValid,
      duration,
      ip,
      timestamp: new Date().toISOString(),
    });
  }

  static trackOtpRequest(email: string, success: boolean, ip?: string) {
    logger.info("OTP request", {
      event: "otp_request",
      email: email.replace(/(.{2}).*@/, "$1***@"), // Partially hide email
      success,
      ip,
      timestamp: new Date().toISOString(),
    });
  }

  static trackBookingSubmission(data: {
    artist?: string;
    eventType?: string;
    budget?: string;
    hasSubscription: boolean;
    success: boolean;
    ip?: string;
  }) {
    logger.info("Booking submission", {
      event: "booking_submission",
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  static trackFormProgress(step: string, ip?: string) {
    logger.info("Form progress", {
      event: "form_progress",
      step,
      ip,
      timestamp: new Date().toISOString(),
    });
  }

  static trackError(error: Error, context: string, additionalData?: any) {
    logger.error("Application error", {
      event: "error",
      context,
      error: error.message,
      stack: error.stack,
      additionalData,
      timestamp: new Date().toISOString(),
    });
  }

  static trackPerformance(
    operation: string,
    duration: number,
    additionalData?: any,
  ) {
    logger.info("Performance metric", {
      event: "performance",
      operation,
      duration,
      additionalData,
      timestamp: new Date().toISOString(),
    });
  }

  static trackCacheHit(key: string, hit: boolean) {
    logger.debug("Cache operation", {
      event: "cache_operation",
      key: key.substring(0, 20) + "...", // Truncate for privacy
      hit,
      timestamp: new Date().toISOString(),
    });
  }

  static trackRateLimit(ip: string, endpoint: string, blocked: boolean) {
    logger.warn("Rate limit check", {
      event: "rate_limit",
      ip,
      endpoint,
      blocked,
      timestamp: new Date().toISOString(),
    });
  }
}

// Middleware for request logging
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.http(`${req.method} ${req.originalUrl}`, {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });
  });

  next();
};

export default logger;
