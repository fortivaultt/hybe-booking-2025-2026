import { db } from "./postgres";
import { Analytics } from "./logger";

// Database schema initialization for production
export async function initializeDatabase() {
  console.info("🔄 Initializing database schema...");
  
  try {
    const health = await db.healthCheck();
    if (!health.connected) {
      console.error("❌ Cannot initialize database: connection failed", health.error);
      return false;
    }

    // Create subscription_ids table if it doesn't exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS subscription_ids (
        id SERIAL PRIMARY KEY,
        subscription_id VARCHAR(20) UNIQUE NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        subscription_type VARCHAR(50) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE,
        last_used_at TIMESTAMP WITH TIME ZONE,
        usage_count INTEGER DEFAULT 0
      )
    `);

    // Create booking_requests table if it doesn't exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS booking_requests (
        id SERIAL PRIMARY KEY,
        celebrity VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        event_type VARCHAR(100) NOT NULL,
        event_date DATE,
        location VARCHAR(500),
        budget_range VARCHAR(50),
        custom_amount DECIMAL(10,2),
        message TEXT,
        subscription_id VARCHAR(20),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        status VARCHAR(50) DEFAULT 'pending',
        FOREIGN KEY (subscription_id) REFERENCES subscription_ids(subscription_id) ON DELETE SET NULL
      )
    `);

    // Create indexes for performance
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_subscription_ids_active 
      ON subscription_ids(subscription_id, is_active) 
      WHERE is_active = true
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_subscription_ids_expires 
      ON subscription_ids(expires_at) 
      WHERE expires_at IS NOT NULL
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_booking_requests_created 
      ON booking_requests(created_at)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_booking_requests_subscription 
      ON booking_requests(subscription_id) 
      WHERE subscription_id IS NOT NULL
    `);

    // Insert sample data if tables are empty (for testing)
    const subscriptionCount = await db.query("SELECT COUNT(*) FROM subscription_ids");
    if (parseInt(subscriptionCount.rows[0].count) === 0) {
      console.info("📊 Inserting sample subscription data...");
      await db.query(`
        INSERT INTO subscription_ids (subscription_id, user_name, subscription_type, expires_at) VALUES
        ('B07200EF6667', 'Test User Premium', 'premium', NOW() + INTERVAL '1 year'),
        ('B07200EF6668', 'Test User Basic', 'basic', NOW() + INTERVAL '6 months'),
        ('B07200EF6669', 'Test User VIP', 'vip', NULL)
      `);
    }

    console.info("✅ Database schema initialized successfully");
    
    Analytics.trackPerformance("database_init", Date.now(), {
      success: true,
      tablesCreated: true
    });

    return true;
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    
    Analytics.trackError(error as Error, "database_initialization", {
      context: "schema_creation"
    });

    return false;
  }
}

export async function checkDatabaseSchema() {
  try {
    const health = await db.healthCheck();
    if (!health.connected) {
      return {
        valid: false,
        error: "Database not connected",
        tables: []
      };
    }

    // Check if required tables exist
    const tables = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('subscription_ids', 'booking_requests')
    `);

    const tableNames = tables.rows.map(row => row.table_name);
    const requiredTables = ['subscription_ids', 'booking_requests'];
    const missingTables = requiredTables.filter(table => !tableNames.includes(table));

    return {
      valid: missingTables.length === 0,
      tables: tableNames,
      missingTables,
      health
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Unknown error",
      tables: []
    };
  }
}
