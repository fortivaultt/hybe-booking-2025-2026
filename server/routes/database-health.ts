import { RequestHandler } from "express";
import { Analytics } from "../utils/logger";
import { db, dbType } from "../utils/db-provider";

export const getDatabaseHealth: RequestHandler = async (req, res) => {
  const startTime = Date.now();

  try {
    const health = await db.healthCheck();

    const response = {
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      database: {
        type: dbType === "supabase" ? "Supabase" : "SQLite",
        connected: health.connected,
        totalSubscriptions: health.totalSubscriptions,
        totalBookings: health.totalBookings,
        error: health.error,
      },
      environment: {
        DB_PROVIDER: dbType,
        SQLITE_DB_PATH: process.env.SQLITE_DB_PATH || "default",
        NODE_ENV: process.env.NODE_ENV || "unknown",
      },
    };

    // Log critical database issues
    if (!health.connected) {
      console.error("❌ SQLite health check failed:", {
        error: health.error,
        timestamp: response.timestamp,
      });

      Analytics.trackError(
        new Error(`SQLite health check failed: ${health.error}`),
        "sqlite_health_check",
        {
          error: health.error,
          ip: req.ip,
        },
      );
    }

    Analytics.trackPerformance("sqlite_health_check", Date.now() - startTime, {
      connected: health.connected,
      totalSubscriptions: health.totalSubscriptions,
      totalBookings: health.totalBookings,
    });

    const httpStatus = health.connected ? 200 : 503;
    res.status(httpStatus).json(response);
  } catch (error) {
    console.error("❌ SQLite health check endpoint error:", error);

    Analytics.trackError(error as Error, "sqlite_health_check_endpoint", {
      ip: req.ip,
      context: "health_check_route",
    });

    res.status(500).json({
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      error: "Health check endpoint failed",
      database: {
        connected: false,
        error: "Health check execution failed",
      },
    });
  }
};

export const getDatabaseConnectionInfo: RequestHandler = async (req, res) => {
  try {
    const health = await sqliteDb.healthCheck();

    res.json({
      timestamp: new Date().toISOString(),
      connection: {
        type: "SQLite",
        dbPath: process.env.SQLITE_DB_PATH || "server/db/hybe.db",
        connected: health.connected,
        totalSubscriptions: health.totalSubscriptions,
        totalBookings: health.totalBookings,
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV || "unknown",
        SQLITE_DB_PATH: process.env.SQLITE_DB_PATH || "default",
      },
    });
  } catch (error) {
    console.error("SQLite connection info error:", error);
    res.status(500).json({
      error: "Failed to get SQLite connection info",
      timestamp: new Date().toISOString(),
    });
  }
};

export const testDatabaseConnection: RequestHandler = async (req, res) => {
  const startTime = Date.now();

  try {
    console.info("🔄 Testing SQLite database connection...");

    const health = await sqliteDb.healthCheck();

    if (!health.connected) {
      return res.status(503).json({
        success: false,
        error: health.error,
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      });
    }

    console.info("✅ Database connection test successful");

    res.json({
      success: true,
      type: dbType === "supabase" ? "Supabase" : "SQLite",
      responseTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      totalSubscriptions: health.totalSubscriptions,
      totalBookings: health.totalBookings,
    });
  } catch (error) {
    console.error("❌ SQLite connection test failed:", error);

    Analytics.trackError(error as Error, "sqlite_connection_test", {
      ip: req.ip,
    });

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      responseTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
  }
};

export const getDatabaseSchema: RequestHandler = async (req, res) => {
  try {
    const health = await db.healthCheck();

    res.json({
      timestamp: new Date().toISOString(),
      schema: {
        type: dbType === "supabase" ? "Supabase" : "SQLite",
        connected: health.connected,
        tables: ["subscription_ids", "booking_requests"],
        totalSubscriptions: health.totalSubscriptions,
        totalBookings: health.totalBookings,
        error: health.error,
      },
    });
  } catch (error) {
    console.error("SQLite schema check error:", error);
    res.status(500).json({
      error: "Failed to check SQLite schema",
      timestamp: new Date().toISOString(),
    });
  }
};

export const initializeDatabaseSchema: RequestHandler = async (req, res) => {
  const startTime = Date.now();

  try {
    console.info("🔄 Initializing SQLite database schema...");

    const result = await sqliteDb.initialize();

    if (result) {
      console.info("✅ SQLite database schema initialization successful");
      const health = await sqliteDb.healthCheck();
      res.json({
        success: true,
        message: "SQLite database schema initialized successfully",
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        totalSubscriptions: health.totalSubscriptions,
        totalBookings: health.totalBookings,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "SQLite database schema initialization failed",
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("❌ SQLite schema initialization failed:", error);

    Analytics.trackError(error as Error, "sqlite_schema_init", {
      ip: req.ip,
    });

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      responseTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
  }
};
