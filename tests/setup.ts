import { afterAll } from 'vitest';
import { disconnectCache } from '../server/utils/cache';

afterAll(() => {
  disconnectCache();
});
