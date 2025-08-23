import { RequestHandler } from "express";
import { z } from "zod";
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import Handlebars from "handlebars";
import { cacheService } from "../utils/cache";
import { Analytics } from "../utils/logger";

// --- Nodemailer Transport Setup ---
const useRealEmailService =
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

const transporter = useRealEmailService
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      secure: parseInt(process.env.SMTP_PORT || "587", 10) === 465, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

// --- Email Template ---
const isProd = process.env.NODE_ENV === "production";
// In production, templates are copied to `dist`. In dev, they are in `src`.
const templateDir = isProd ? "dist/email-templates" : "src/email-templates";
const templatePath = path.join(process.cwd(), templateDir, "otp-template.hbs");
const templateSource = fs.readFileSync(templatePath, "utf-8");
const emailTemplate = Handlebars.compile(templateSource);

// --- Constants ---
const OTP_EXPIRATION_SECONDS = 300; // 5 minutes
const OTP_RESEND_COOLDOWN_SECONDS = 60; // 1 minute
const OTP_MAX_VERIFY_ATTEMPTS = 5;

// --- Route Handlers ---

const sendOtpBodySchema = z.object({
  email: z.string().email(),
});

export const handleSendOtp: RequestHandler = async (req, res) => {
  const startTime = Date.now();

  try {
    const { email } = sendOtpBodySchema.parse(req.body);

    // 1. Resend Cooldown Check
    const cooldownKey = `otp_cooldown:${email}`;
    const isOnCooldown = await cacheService.get(cooldownKey);
    if (isOnCooldown) {
      return res.status(429).json({
        success: false,
        message: "Please wait before requesting another OTP.",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpKey = `otp:${email}`;

    // Store OTP in cache
    const cacheSuccess = await cacheService.set(
      otpKey,
      otp,
      OTP_EXPIRATION_SECONDS,
    );
    if (!cacheSuccess) {
      throw new Error("Failed to store OTP in cache");
    }
    // Reset verify attempts counter on new OTP
    await cacheService.del(`otp_verify_attempts:${email}`);

    // --- Send Email or Log to Console ---
    const emailHtml = emailTemplate({
      OTP: otp,
      expirationMinutes: Math.round(OTP_EXPIRATION_SECONDS / 60),
    });

    const emailStartTime = Date.now();
    let emailSuccess = false;

    if (transporter) {
      await transporter.sendMail({
        from: `"HYBE Support" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Your HYBE Booking Verification Code",
        html: emailHtml,
      });
      emailSuccess = true;
    } else {
      console.log("--- SIMULATED OTP EMAIL (SMTP not configured) ---");
      console.log(`To: ${email}`);
      console.log(emailHtml);
      console.log("--- END SIMULATED OTP EMAIL ---");
      emailSuccess = true;
    }

    Analytics.trackPerformance("email_send", Date.now() - emailStartTime, {
      email_service: transporter ? "smtp" : "console",
      success: emailSuccess,
    });

    // Set the cooldown period
    await cacheService.set(cooldownKey, "true", OTP_RESEND_COOLDOWN_SECONDS);

    Analytics.trackOtpRequest(email, true, req.ip);
    res.status(200).json({ success: true, message: "OTP sent successfully." });
  } catch (error) {
    Analytics.trackOtpRequest(req.body?.email || "unknown", false, req.ip);
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ success: false, message: error.errors[0].message });
    }
    console.error("OTP send error:", error);
    Analytics.trackError(error as Error, "otp_send", {
      email: req.body?.email,
      ip: req.ip,
      duration: Date.now() - startTime,
    });
    res.status(500).json({ success: false, message: "Failed to send OTP." });
  }
};

const verifyOtpBodySchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

export const handleVerifyOtp: RequestHandler = async (req, res) => {
  const startTime = Date.now();
  try {
    const { email, otp } = verifyOtpBodySchema.parse(req.body);
    const otpKey = `otp:${email}`;
    const attemptsKey = `otp_verify_attempts:${email}`;

    // 1. Brute-Force Check
    const attempts = (await cacheService.get<number>(attemptsKey)) || 0;
    if (attempts >= OTP_MAX_VERIFY_ATTEMPTS) {
      await cacheService.del(otpKey); // Invalidate OTP
      Analytics.trackPerformance("otp_verification", Date.now() - startTime, {
        success: false,
        reason: "max_attempts_exceeded",
      });
      return res.status(403).json({
        success: false,
        message:
          "Too many failed attempts. Please request a new verification code.",
      });
    }

    // 2. Verify OTP
    const storedOtp = await cacheService.get<string>(otpKey);
    if (!storedOtp) {
      Analytics.trackPerformance("otp_verification", Date.now() - startTime, {
        success: false,
        reason: "not_found_or_expired",
      });
      return res.status(400).json({
        success: false,
        message: "OTP not found or has expired. Please request a new one.",
      });
    }

    if (storedOtp !== otp) {
      // Increment failed attempts
      await cacheService.set(attemptsKey, attempts + 1, OTP_EXPIRATION_SECONDS);
      Analytics.trackPerformance("otp_verification", Date.now() - startTime, {
        success: false,
        reason: "invalid_otp",
      });
      return res.status(400).json({ success: false, message: "Invalid OTP." });
    }

    // 3. Success: Clear OTP and attempts counter
    await cacheService.del(otpKey);
    await cacheService.del(attemptsKey);

    Analytics.trackPerformance("otp_verification", Date.now() - startTime, {
      success: true,
      email: email.replace(/(.{2}).*@/, "$1***@"),
    });
    res
      .status(200)
      .json({ success: true, message: "OTP verified successfully." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ success: false, message: error.errors[0].message });
    }
    Analytics.trackError(error as Error, "otp_verification", {
      email: req.body?.email,
      ip: req.ip,
      duration: Date.now() - startTime,
    });
    res.status(500).json({ success: false, message: "Failed to verify OTP." });
  }
};
