import { createClient } from "redis";

// Redis client singleton
let redisClient: ReturnType<typeof createClient> | null = null;

export const initializeRedis = async () => {
  if (redisClient) {
    return redisClient;
  }

  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || "redis://localhost:6379",
      socket: {
        connectTimeout: 5000,
        lazyConnect: true,
      },
    });

    redisClient.on("error", (err) => {
      console.error("Redis Client Error:", err);
    });

    redisClient.on("connect", () => {
      console.info("Redis Client Connected");
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error("Failed to initialize Redis:", error);
    redisClient = null;
    return null;
  }
};

export const getRedisClient = () => {
  return redisClient;
};

export const disconnectRedis = async () => {
  if (redisClient && redisClient.isOpen) {
    await redisClient.disconnect();
    redisClient = null;
  }
};

// Cache utility functions
export class CacheService {
  private getClient() {
    return getRedisClient();
  }

  async get<T>(key: string): Promise<T | null> {
    const client = this.getClient();
    if (!client) return null;

    try {
      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  }

  async set(
    key: string,
    value: any,
    ttlSeconds: number = 300,
  ): Promise<boolean> {
    const client = this.getClient();
    if (!client) return false;

    try {
      await client.setEx(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error("Cache set error:", error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    const client = this.getClient();
    if (!client) return false;

    try {
      await client.del(key);
      return true;
    } catch (error) {
      console.error("Cache delete error:", error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    const client = this.getClient();
    if (!client) return false;

    try {
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      console.error("Cache exists error:", error);
      return false;
    }
  }

  // Subscription-specific cache methods
  async cacheSubscriptionValidation(
    subscriptionId: string,
    validationResult: any,
    ttlSeconds: number = 300,
  ): Promise<boolean> {
    const cacheKey = `subscription:${subscriptionId}`;
    return this.set(cacheKey, validationResult, ttlSeconds);
  }

  async getCachedSubscriptionValidation(
    subscriptionId: string,
  ): Promise<any | null> {
    const cacheKey = `subscription:${subscriptionId}`;
    return this.get(cacheKey);
  }

  async invalidateSubscriptionCache(subscriptionId: string): Promise<boolean> {
    const cacheKey = `subscription:${subscriptionId}`;
    return this.del(cacheKey);
  }
}

export const cacheService = new CacheService();
