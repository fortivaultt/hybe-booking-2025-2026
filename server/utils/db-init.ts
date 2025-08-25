import { sqliteDb } from "./sqlite-db";
import { Analytics } from "./logger";

// SQLite database initialization for production
export async function initializeDatabase() {
  console.info("🔄 Initializing SQLite database...");

  try {
    const result = await sqliteDb.initialize();

    if (result) {
      console.info("✅ SQLite database initialized successfully");

      const health = await sqliteDb.healthCheck();
      console.info(
        `📊 Database stats: ${health.totalSubscriptions} subscriptions, ${health.totalBookings} bookings`,
      );

      Analytics.trackPerformance("sqlite_init", Date.now(), {
        success: true,
        totalSubscriptions: health.totalSubscriptions,
        totalBookings: health.totalBookings,
      });

      return true;
    } else {
      console.error("❌ SQLite database initialization failed");
      return false;
    }
  } catch (error) {
    console.error("❌ SQLite database initialization failed:", error);

    Analytics.trackError(error as Error, "sqlite_initialization", {
      context: "database_init",
    });

    return false;
  }
}

export async function checkDatabaseSchema() {
  try {
    const health = await sqliteDb.healthCheck();

    if (!health.connected) {
      return {
        valid: false,
        error: health.error || "SQLite database not connected",
        tables: [],
      };
    }

    const requiredTables = ["subscription_ids", "booking_requests"];

    return {
      valid: health.connected,
      type: "SQLite",
      tables: requiredTables,
      totalSubscriptions: health.totalSubscriptions,
      totalBookings: health.totalBookings,
      health,
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Unknown error",
      tables: [],
    };
  }
}
