import { RequestHandler } from "express";
import { z } from "zod";
import fs from "fs";
import path from "path";

// In-memory store for OTPs
// In a production environment, you would use a more persistent store like Redis or a database table.
const otpStore: Record<string, { otp: string; expiresAt: number }> = {};

const sendOtpBodySchema = z.object({
  email: z.string().email(),
});

export const handleSendOtp: RequestHandler = (req, res) => {
  try {
    const { email } = sendOtpBodySchema.parse(req.body);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiration

    otpStore[email] = { otp, expiresAt };

    // In a real application, you would send the OTP via email here.
    // For this example, we'll read an HTML template, inject the OTP, and log it.
    try {
      const templatePath = path.join(__dirname, '../email-templates/otp-template.html');
      const template = fs.readFileSync(templatePath, 'utf-8');
      const emailHtml = template.replace('{{OTP}}', otp);

      console.log('--- SIMULATED OTP EMAIL ---');
      console.log(`To: ${email}`);
      console.log(`Subject: Your HYBE Booking OTP`);
      console.log(emailHtml);
      console.log('--- END SIMULATED OTP EMAIL ---');

    } catch (templateError) {
      console.error("Failed to read or process email template:", templateError);
      // Fallback to simple console log if template fails
      console.log(`OTP for ${email}: ${otp}`);
    }

    res.status(200).json({ success: true, message: "OTP sent successfully." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: error.errors[0].message });
    }
    console.error("Error sending OTP:", error);
    res.status(500).json({ success: false, message: "Failed to send OTP." });
  }
};

const verifyOtpBodySchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

export const handleVerifyOtp: RequestHandler = (req, res) => {
  try {
    const { email, otp } = verifyOtpBodySchema.parse(req.body);

    const storedOtpData = otpStore[email];

    if (!storedOtpData) {
      return res.status(400).json({ success: false, message: "OTP not found for this email. Please request a new one." });
    }

    if (Date.now() > storedOtpData.expiresAt) {
      delete otpStore[email]; // Clean up expired OTP
      return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
    }

    if (storedOtpData.otp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP." });
    }

    // OTP is correct, clean it up so it can't be reused
    delete otpStore[email];

    res.status(200).json({ success: true, message: "OTP verified successfully." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: error.errors[0].message });
    }
    console.error("Error verifying OTP:", error);
    res.status(500).json({ success: false, message: "Failed to verify OTP." });
  }
};
