import { initializeDatabase, getDatabase, closeDatabase } from "./database";

let cleanupInterval: NodeJS.Timeout | null = null;

export const initializeCache = async () => {
  const db = await initializeDatabase();
  if (db) {
    // Periodically clean up expired cache entries
    cleanupInterval = setInterval(() => {
      try {
        const now = Math.floor(Date.now() / 1000);
        db.run("DELETE FROM cache WHERE expires_at IS NOT NULL AND expires_at < ?", [now]);
      } catch (error) {
        console.error("Error cleaning up expired cache entries:", error);
      }
    }, 60 * 1000); // Every minute
  }
  return db;
};

export const disconnectCache = () => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
  closeDatabase();
};

export class CacheService {
  private getClient() {
    return getDatabase();
  }

  get<T>(key: string): T | null {
    const db = this.getClient();
    if (!db) return null;

    try {
      const stmt = db.prepare("SELECT value FROM cache WHERE key = ? AND (expires_at IS NULL OR expires_at > ?)");
      stmt.bind([key, Math.floor(Date.now() / 1000)]);
      let result: T | null = null;
      if (stmt.step()) {
        const [value] = stmt.get();
        result = JSON.parse(value as string);
      }
      stmt.free();
      return result;
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  }

  set(
    key: string,
    value: any,
    ttlSeconds: number = 300,
  ): boolean {
    const db = this.getClient();
    if (!db) return false;

    try {
      const expires_at = ttlSeconds ? Math.floor(Date.now() / 1000) + ttlSeconds : null;
      db.run(
        "REPLACE INTO cache (key, value, expires_at) VALUES (?, ?, ?)",
        [key, JSON.stringify(value), expires_at]
      );
      return true;
    } catch (error) {
      console.error("Cache set error:", error);
      return false;
    }
  }

  del(key: string): boolean {
    const db = this.getClient();
    if (!db) return false;

    try {
      db.run("DELETE FROM cache WHERE key = ?", [key]);
      return true;
    } catch (error) {
      console.error("Cache delete error:", error);
      return false;
    }
  }

  exists(key: string): boolean {
    const db = this.getClient();
    if (!db) return false;

    try {
      const stmt = db.prepare("SELECT 1 FROM cache WHERE key = ? AND (expires_at IS NULL OR expires_at > ?)");
      stmt.bind([key, Math.floor(Date.now() / 1000)]);
      const result = stmt.step();
      stmt.free();
      return result;
    } catch (error) {
      console.error("Cache exists error:", error);
      return false;
    }
  }

  // Subscription-specific cache methods
  cacheSubscriptionValidation(
    subscriptionId: string,
    validationResult: any,
    ttlSeconds: number = 300,
  ): boolean {
    const cacheKey = `subscription:${subscriptionId}`;
    return this.set(cacheKey, validationResult, ttlSeconds);
  }

  getCachedSubscriptionValidation(
    subscriptionId: string,
  ): any | null {
    const cacheKey = `subscription:${subscriptionId}`;
    return this.get(cacheKey);
  }

  invalidateSubscriptionCache(subscriptionId: string): boolean {
    const cacheKey = `subscription:${subscriptionId}`;
    return this.del(cacheKey);
  }
}

export const cacheService = new CacheService();
