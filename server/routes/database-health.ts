import { RequestHandler } from "express";
import { db } from "../utils/postgres";
import { Analytics } from "../utils/logger";
import { checkDatabaseSchema, initializeDatabase } from "../utils/db-init";

export const getDatabaseHealth: RequestHandler = async (req, res) => {
  const startTime = Date.now();

  try {
    const health = await db.healthCheck();
    const status = db.getStatus();

    const response = {
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      database: {
        connected: health.connected,
        hasConnectionString: health.connectionString,
        connectionAttempts: health.attempts,
        lastAttempt: health.lastAttempt,
        error: health.error,
        poolStatus: {
          hasPool: status.hasPool,
          isConnected: status.isConnected,
          connectionAttempts: status.connectionAttempts,
          lastAttempt: status.lastAttempt,
          hasConnectionString: status.hasConnectionString,
        },
      },
      environment: {
        DATABASE_URL_SET: !!process.env.DATABASE_URL,
        DATABASE_URL_PREFIX: process.env.DATABASE_URL
          ? process.env.DATABASE_URL.substring(0, 20) + "..."
          : "not set",
        NODE_ENV: process.env.NODE_ENV || "unknown",
      },
    };

    // Log critical database issues
    if (!health.connected) {
      console.error("❌ Database health check failed:", {
        error: health.error,
        attempts: health.attempts,
        hasConnectionString: health.connectionString,
        timestamp: response.timestamp,
      });

      Analytics.trackError(
        new Error(`Database health check failed: ${health.error}`),
        "database_health_check",
        {
          attempts: health.attempts,
          hasConnectionString: health.connectionString,
          ip: req.ip,
        },
      );
    }

    Analytics.trackPerformance(
      "database_health_check",
      Date.now() - startTime,
      {
        connected: health.connected,
        attempts: health.attempts,
      },
    );

    const httpStatus = health.connected ? 200 : 503;
    res.status(httpStatus).json(response);
  } catch (error) {
    console.error("❌ Database health check endpoint error:", error);

    Analytics.trackError(error as Error, "database_health_check_endpoint", {
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
    const connectionString = db.getConnectionString();
    const isValid = connectionString
      ? db.isValidConnectionString(connectionString)
      : false;

    res.json({
      timestamp: new Date().toISOString(),
      connection: {
        hasConnectionString: !!connectionString,
        isValidFormat: isValid,
        prefix: connectionString
          ? connectionString.substring(0, 20) + "..."
          : "not set",
        protocol: connectionString
          ? connectionString.split("://")[0]
          : "unknown",
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV || "unknown",
        DATABASE_URL_SET: !!process.env.DATABASE_URL,
      },
      status: db.getStatus(),
    });
  } catch (error) {
    console.error("Database connection info error:", error);
    res.status(500).json({
      error: "Failed to get database connection info",
      timestamp: new Date().toISOString(),
    });
  }
};

export const testDatabaseConnection: RequestHandler = async (req, res) => {
  const startTime = Date.now();

  try {
    console.info("🔄 Testing database connection...");

    const health = await db.healthCheck();

    if (!health.connected) {
      return res.status(503).json({
        success: false,
        error: health.error,
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      });
    }

    // Run a more comprehensive test
    const testQuery = await db.query(
      "SELECT NOW() as server_time, version() as postgres_version",
    );

    console.info("✅ Database connection test successful");

    res.json({
      success: true,
      responseTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      serverTime: testQuery.rows[0].server_time,
      postgresVersion: testQuery.rows[0].postgres_version,
    });
  } catch (error) {
    console.error("❌ Database connection test failed:", error);

    Analytics.trackError(error as Error, "database_connection_test", {
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
    const schema = await checkDatabaseSchema();

    res.json({
      timestamp: new Date().toISOString(),
      schema,
    });
  } catch (error) {
    console.error("Database schema check error:", error);
    res.status(500).json({
      error: "Failed to check database schema",
      timestamp: new Date().toISOString(),
    });
  }
};

export const initializeDatabaseSchema: RequestHandler = async (req, res) => {
  const startTime = Date.now();

  try {
    console.info("🔄 Initializing database schema...");

    const result = await initializeDatabase();

    if (result) {
      console.info("✅ Database schema initialization successful");
      res.json({
        success: true,
        message: "Database schema initialized successfully",
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Database schema initialization failed",
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("❌ Database schema initialization failed:", error);

    Analytics.trackError(error as Error, "database_schema_init", {
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
