import { beforeAll, afterAll } from 'vitest';
import { disconnectCache } from '../server/utils/cache';

beforeAll(() => {
  process.env.SMTP_HOST = '';
  process.env.SMTP_USER = '';
  process.env.SMTP_PASS = '';
  process.env.SMTP_SECURE = 'false';
  process.env.SMTP_PORT = '587';
  process.env.NODE_ENV = 'test';
});

afterAll(() => {
  disconnectCache();
});
