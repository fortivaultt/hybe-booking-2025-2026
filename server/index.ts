import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleBookingSubmission } from "./routes/booking";
import { validateSubscriptionId, listSubscriptionTypes } from "./routes/subscription";
import { handleSendOtp, handleVerifyOtp } from "./routes/otp";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);
  app.post("/api/booking", handleBookingSubmission);
  app.post("/api/subscription/validate", validateSubscriptionId);
  app.get("/api/subscription/types", listSubscriptionTypes);

  // OTP routes
  app.post("/api/otp/send", handleSendOtp);
  app.post("/api/otp/verify", handleVerifyOtp);

  return app;
}
