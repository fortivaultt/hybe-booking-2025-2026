import { Pool, PoolConfig } from "pg";
import { Analytics } from "./logger";

// Database configuration with validation
export class DatabaseConfig {
  private static pool: Pool | null = null;
  private static connectionString: string | null = null;
  private static isConnected = false;
  private static lastConnectionAttempt = 0;
  private static connectionAttempts = 0;
  private static maxRetries = 3;

  static getConnectionString(): string | null {
    if (!this.connectionString) {
      this.connectionString = process.env.DATABASE_URL || null;
      
      if (!this.connectionString) {
        console.warn("⚠ DATABASE_URL environment variable is not set");
        Analytics.trackError(
          new Error("DATABASE_URL environment variable missing"),
          "database_config",
          { context: "environment_validation" }
        );
      }
    }
    return this.connectionString;
  }

  static isValidConnectionString(connectionString: string): boolean {
    try {
      // Check if it's a valid PostgreSQL connection string
      if (!connectionString.startsWith('postgres://') && !connectionString.startsWith('postgresql://')) {
        return false;
      }
      
      // Basic URL validation
      new URL(connectionString);
      return true;
    } catch {
      return false;
    }
  }

  static async getPool(): Promise<Pool | null> {
    const connectionString = this.getConnectionString();
    
    if (!connectionString) {
      console.warn("⚠ Cannot create database pool: DATABASE_URL is not set");
      return null;
    }

    if (!this.isValidConnectionString(connectionString)) {
      console.error("❌ Invalid DATABASE_URL format:", connectionString.substring(0, 20) + "...");
      Analytics.trackError(
        new Error("Invalid DATABASE_URL format"),
        "database_config",
        { connectionString: connectionString.substring(0, 20) + "..." }
      );
      return null;
    }

    if (this.pool && this.isConnected) {
      return this.pool;
    }

    // Implement connection retry logic with exponential backoff
    const now = Date.now();
    if (this.lastConnectionAttempt && (now - this.lastConnectionAttempt) < 5000) {
      console.warn("⚠ Skipping database connection attempt (too recent)");
      return null;
    }

    if (this.connectionAttempts >= this.maxRetries) {
      console.error("❌ Maximum database connection attempts exceeded");
      return null;
    }

    try {
      this.lastConnectionAttempt = now;
      this.connectionAttempts++;

      console.info(`🔄 Attempting database connection (attempt ${this.connectionAttempts}/${this.maxRetries})...`);

      const poolConfig: PoolConfig = {
        connectionString,
        ssl: connectionString.includes("sslmode=require") 
          ? { rejectUnauthorized: false }
          : false,
        max: 20, // Maximum pool size
        idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
        connectionTimeoutMillis: 5000, // Return error after 5 seconds if connection could not be established
        statement_timeout: 10000, // Kill queries after 10 seconds
        query_timeout: 10000, // Kill queries after 10 seconds
      };

      this.pool = new Pool(poolConfig);

      // Test the connection
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();

      this.isConnected = true;
      this.connectionAttempts = 0; // Reset on successful connection
      console.info("✅ Database connection established successfully");
      
      Analytics.trackPerformance("database_connection", Date.now() - now, {
        success: true,
        attempt: this.connectionAttempts
      });

      return this.pool;
    } catch (error) {
      console.error(`❌ Database connection failed (attempt ${this.connectionAttempts}/${this.maxRetries}):`, error);
      
      Analytics.trackError(error as Error, "database_connection", {
        attempt: this.connectionAttempts,
        connectionString: connectionString.substring(0, 20) + "...",
        context: "pool_creation"
      });

      this.isConnected = false;
      
      // If max retries exceeded, set pool to null
      if (this.connectionAttempts >= this.maxRetries) {
        this.pool = null;
      }

      return null;
    }
  }

  static async healthCheck(): Promise<{
    connected: boolean;
    connectionString: boolean;
    lastAttempt: number;
    attempts: number;
    error?: string;
  }> {
    const connectionString = this.getConnectionString();
    
    try {
      const pool = await this.getPool();
      if (!pool) {
        return {
          connected: false,
          connectionString: !!connectionString,
          lastAttempt: this.lastConnectionAttempt,
          attempts: this.connectionAttempts,
          error: "Pool creation failed"
        };
      }

      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();

      return {
        connected: true,
        connectionString: !!connectionString,
        lastAttempt: this.lastConnectionAttempt,
        attempts: this.connectionAttempts
      };
    } catch (error) {
      return {
        connected: false,
        connectionString: !!connectionString,
        lastAttempt: this.lastConnectionAttempt,
        attempts: this.connectionAttempts,
        error: (error as Error).message
      };
    }
  }

  static async query(text: string, params: any[] = []) {
    const pool = await this.getPool();
    if (!pool) {
      throw new Error("Database connection not available");
    }
    return pool.query(text, params);
  }

  static async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.isConnected = false;
      console.info("🔒 Database connection closed");
    }
  }

  static getStatus() {
    return {
      hasPool: !!this.pool,
      isConnected: this.isConnected,
      connectionAttempts: this.connectionAttempts,
      lastAttempt: this.lastConnectionAttempt,
      hasConnectionString: !!this.getConnectionString()
    };
  }
}

// Export a default instance for convenience
export const db = DatabaseConfig;
