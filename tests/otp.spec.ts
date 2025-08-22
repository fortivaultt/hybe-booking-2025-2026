import { describe, it, expect, beforeAll } from 'vitest';
import supertest from 'supertest';
import { createServer } from '../server';
import { cacheService } from '../server/utils/cache';
import type { Express } from 'express';

let app: Express;

beforeAll(async () => {
  app = await createServer();
});

describe('OTP API', () => {
  const testEmail = 'test@example.com';

  it('should send an OTP to a valid email address', async () => {
    const response = await supertest(app)
      .post('/api/otp/send')
      .send({ email: testEmail });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('OTP sent successfully.');
  });

  it('should return an error for an invalid email address', async () => {
    const response = await supertest(app)
      .post('/api/otp/send')
      .send({ email: 'invalid-email' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('should verify a valid OTP', async () => {
    // 1. Send OTP to get a valid one in the cache
    await supertest(app)
      .post('/api/otp/send')
      .send({ email: testEmail });

    // 2. Get the OTP from the cache for the test
    const otp = await cacheService.get<string>(`otp:${testEmail}`);
    expect(otp).toBeDefined();

    // 3. Verify the OTP
    const response = await supertest(app)
      .post('/api/otp/verify')
      .send({ email: testEmail, otp });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('OTP verified successfully.');
  });

  it('should return an error for an invalid OTP', async () => {
    // 1. Send OTP to get a valid one in the cache
    await supertest(app)
      .post('/api/otp/send')
      .send({ email: testEmail });

    const response = await supertest(app)
      .post('/api/otp/verify')
      .send({ email: testEmail, otp: '000000' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Invalid OTP.');
  });
});
