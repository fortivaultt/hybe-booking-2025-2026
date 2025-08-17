import { RequestHandler } from "express";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { createClient, RedisClientType } from "redis";

// Lazy-loaded Redis Client
let redisClient: RedisClientType | undefined;
const redisUrl = "redis://default:kPoLgM4FzXb9vsjWskfDHl4X9FkxJrJG@redis-15524.c14.us-east-1-3.ec2.redns.redis-cloud.com:15524";

async function getRedisClient() {
  if (!redisClient) {
    const client = createClient({ url: redisUrl });
    client.on('error', err => console.error('Redis Client Error', err));
    await client.connect();
    redisClient = client as RedisClientType;
  }
  return redisClient;
}

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

    // Store OTP in Redis with expiration
    await client.set(otpKey, otp, {
      EX: otpExpiration,
    });

    // Simulate sending email
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

    // OTP is correct, clean it up so it can't be reused
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
