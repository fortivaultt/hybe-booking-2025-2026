import { vi } from 'vitest';

// Mock the 'redis' library
vi.mock('redis', () => {
  // Create a mock in-memory store to simulate Redis behavior
  const mockStore = new Map<string, string>();

  // Mock implementations of the functions we use from the redis client
  const mockRedisClient = {
    on: vi.fn(),
    connect: vi.fn(() => Promise.resolve()),
    get: vi.fn((key: string) => {
      return Promise.resolve(mockStore.get(key) || null);
    }),
    set: vi.fn((key: string, value: string, options?: { EX: number }) => {
      mockStore.set(key, value);
      if (options?.EX) {
        setTimeout(() => {
          mockStore.delete(key);
        }, options.EX * 1000);
      }
      return Promise.resolve('OK');
    }),
    del: vi.fn((key: string) => {
      const hadKey = mockStore.has(key);
      mockStore.delete(key);
      return Promise.resolve(hadKey ? 1 : 0);
    }),
    quit: vi.fn(() => Promise.resolve()),
  };

  // The 'redis' library exports a `createClient` function
  return {
    createClient: vi.fn(() => mockRedisClient),
  };
});
