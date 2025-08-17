import { RequestHandler } from "express";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { createClient, RedisClientType } from "redis";
import nodemailer from "nodemailer";

// --- Redis Client Setup ---
let redisClient: RedisClientType | undefined;

async function getRedisClient() {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      throw new Error("REDIS_URL environment variable not set.");
    }
    const client = createClient({ url: redisUrl });
    client.on('error', err => console.error('Redis Client Error', err));
    await client.connect();
    redisClient = client as RedisClientType;
  }
  return redisClient;
}

// --- Nodemailer Transport Setup ---
const useRealEmailService = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

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

// --- Route Handlers ---

const sendOtpBodySchema = z.object({
  email: z.string().email(),
});

export const handleSendOtp: RequestHandler = async (req, res) => {
  try {
    const client = await getRedisClient();
    const { email } = sendOtpBodySchema.parse(req.body);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpKey = `otp:${email}`;
    const otpExpiration = 300; // 5 minutes in seconds

    await client.set(otpKey, otp, {
      EX: otpExpiration,
    });

    // --- Send Email or Log to Console ---
    const templatePath = path.join(__dirname, '../email-templates/otp-template.html');
    const template = fs.readFileSync(templatePath, 'utf-8');
    const emailHtml = template.replace('{{OTP}}', otp);

    if (transporter) {
      // Send real email
      await transporter.sendMail({
        from: `"HYBE Support" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Your HYBE Booking Verification Code",
        html: emailHtml,
      });
    } else {
      // Fallback to console logging
      console.log('--- SIMULATED OTP EMAIL (SMTP not configured) ---');
      console.log(`To: ${email}`);
      console.log(emailHtml);
      console.log('--- END SIMULATED OTP EMAIL ---');
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

export const handleVerifyOtp: RequestHandler = async (req, res) => {
  try {
    const client = await getRedisClient();
    const { email, otp } = verifyOtpBodySchema.parse(req.body);
    const otpKey = `otp:${email}`;

    const storedOtp = await client.get(otpKey);

    if (!storedOtp) {
      return res.status(400).json({ success: false, message: "OTP not found or has expired. Please request a new one." });
    }

    if (storedOtp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP." });
    }

    await client.del(otpKey);
    res.status(200).json({ success: true, message: "OTP verified successfully." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: error.errors[0].message });
    }
    console.error("Error verifying OTP:", error);
    res.status(500).json({ success: false, message: "Failed to verify OTP." });
  }
};
