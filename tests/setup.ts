import { afterAll } from 'vitest';
import { disconnectRedis } from '../server/utils/cache';

afterAll(async () => {
  await disconnectRedis();
});
