import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import supertest from "supertest";
import { createServer } from "../server";
import { cacheService } from "../server/utils/cache";
import type { Express } from "express";

let app: Express;

// Helper function to sleep for a specified duration
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

beforeAll(async () => {
  app = await createServer();
});

describe("OTP API", () => {
  const testEmail = "test@example.com";
  const otpKey = `otp:${testEmail}`;
  const cooldownKey = `otp_cooldown:${testEmail}`;
  const attemptsKey = `otp_verify_attempts:${testEmail}`;

  // Clear cache before each test to ensure isolation
  beforeEach(async () => {
    await cacheService.del(otpKey);
    await cacheService.del(cooldownKey);
    await cacheService.del(attemptsKey);
  });

  describe("Send OTP", () => {
    it("should send an OTP to a valid email address", async () => {
      const response = await supertest(app)
        .post("/api/otp/send")
        .send({ email: testEmail });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("OTP sent successfully.");

      // Verify OTP and cooldown are in cache
      const otp = await cacheService.get(otpKey);
      const cooldown = await cacheService.get(cooldownKey);
      expect(otp).toBeDefined();
      expect(cooldown).toBeDefined();
    });

    it("should return an error for an invalid email address", async () => {
      const response = await supertest(app)
        .post("/api/otp/send")
        .send({ email: "invalid-email" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should respect the resend cooldown period", async () => {
      // First request should succeed
      await supertest(app).post("/api/otp/send").send({ email: testEmail });

      // Immediate second request should fail
      const response = await supertest(app)
        .post("/api/otp/send")
        .send({ email: testEmail });

      expect(response.status).toBe(429);
      expect(response.body.message).toBe(
        "Please wait before requesting another OTP.",
      );
    });
  });

  describe("Verify OTP", () => {
    it("should verify a valid OTP and clear cache entries", async () => {
      await supertest(app).post("/api/otp/send").send({ email: testEmail });
      const otp = await cacheService.get<string>(otpKey);
      expect(otp).toBeDefined();

      const response = await supertest(app)
        .post("/api/otp/verify")
        .send({ email: testEmail, otp });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("OTP verified successfully.");

      // Verify OTP and attempts counter are cleared
      const clearedOtp = await cacheService.get(otpKey);
      const clearedAttempts = await cacheService.get(attemptsKey);
      expect(clearedOtp).toBeNull();
      expect(clearedAttempts).toBeNull();
    });

    it("should return an error for an invalid OTP and increment attempts", async () => {
      await supertest(app).post("/api/otp/send").send({ email: testEmail });

      const response = await supertest(app)
        .post("/api/otp/verify")
        .send({ email: testEmail, otp: "000000" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Invalid OTP.");

      // Verify attempts counter is incremented
      const attempts = await cacheService.get<number>(attemptsKey);
      expect(attempts).toBe(1);
    });

    it("should trigger brute-force protection after max attempts", async () => {
      await supertest(app).post("/api/otp/send").send({ email: testEmail });

      // Fail verification 5 times
      for (let i = 0; i < 5; i++) {
        await supertest(app)
          .post("/api/otp/verify")
          .send({ email: testEmail, otp: `11111${i}` });
      }

      const attempts = await cacheService.get<number>(attemptsKey);
      expect(attempts).toBe(5);

      // The 6th attempt should be blocked
      const response = await supertest(app)
        .post("/api/otp/verify")
        .send({ email: testEmail, otp: "222222" });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain("Too many failed attempts");

      // Check if the OTP was invalidated (deleted)
      const otp = await cacheService.get(otpKey);
      expect(otp).toBeNull();
    });
  });
});
