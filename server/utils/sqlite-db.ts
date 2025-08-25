import initSqlJs from "sql.js";
import fs from "fs";
import path from "path";
import { Analytics } from "./logger";

let db: initSqlJs.Database | null = null;

export interface SubscriptionRecord {
  id?: number;
  subscription_id: string;
  user_name: string;
  subscription_type: "premium" | "elite" | "standard";
  is_active: boolean;
  created_at: string;
  expires_at?: string;
  last_used_at?: string;
  usage_count: number;
}

export interface BookingRecord {
  id?: number;
  booking_id: string;
  celebrity: string;
  full_name: string;
  email: string;
  phone: string;
  organization?: string;
  event_type: string;
  event_date?: string;
  location: string;
  budget_range: string;
  custom_amount?: number;
  attendees: string;
  special_requests: string;
  subscription_id?: string;
  privacy_consent: boolean;
  created_at: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
}

class SQLiteManager {
  private static instance: SQLiteManager;
  private database: initSqlJs.Database | null = null;
  private dbPath = process.env.SQLITE_DB_PATH || "server/db/hybe.db";

  private constructor() {}

  static getInstance(): SQLiteManager {
    if (!SQLiteManager.instance) {
      SQLiteManager.instance = new SQLiteManager();
    }
    return SQLiteManager.instance;
  }

  async initialize(): Promise<boolean> {
    if (this.database) {
      return true;
    }

    try {
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const wasmUrl = path.join(
        "node_modules",
        "sql.js",
        "dist",
        "sql-wasm.wasm",
      );
      const SQL = await initSqlJs({
        locateFile: () => wasmUrl,
      });

      let buffer: Buffer | null = null;
      if (fs.existsSync(this.dbPath)) {
        buffer = fs.readFileSync(this.dbPath);
      }

      this.database = new SQL.Database(buffer);
      await this.createTables();
      await this.insertSampleData();
      this.saveToFile();

      console.info("✅ SQLite database initialized successfully");
      return true;
    } catch (error) {
      console.error("❌ Failed to initialize SQLite database:", error);
      Analytics.trackError(error as Error, "sqlite_initialization", {
        dbPath: this.dbPath,
      });
      return false;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.database) {
      throw new Error("Database not initialized");
    }

    // Create subscription_ids table
    this.database.run(`
      CREATE TABLE IF NOT EXISTS subscription_ids (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subscription_id TEXT UNIQUE NOT NULL,
        user_name TEXT NOT NULL,
        subscription_type TEXT NOT NULL CHECK(subscription_type IN ('premium', 'elite', 'standard')),
        is_active BOOLEAN DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        expires_at TEXT,
        last_used_at TEXT,
        usage_count INTEGER DEFAULT 0
      )
    `);

    // Create booking_requests table
    this.database.run(`
      CREATE TABLE IF NOT EXISTS booking_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_id TEXT UNIQUE NOT NULL,
        celebrity TEXT NOT NULL,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        organization TEXT,
        event_type TEXT NOT NULL,
        event_date TEXT,
        location TEXT NOT NULL,
        budget_range TEXT NOT NULL,
        custom_amount REAL,
        attendees TEXT NOT NULL,
        special_requests TEXT,
        subscription_id TEXT,
        privacy_consent BOOLEAN NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'completed', 'cancelled')),
        FOREIGN KEY (subscription_id) REFERENCES subscription_ids(subscription_id)
      )
    `);

    // Create indexes for performance
    this.database.run(`
      CREATE INDEX IF NOT EXISTS idx_subscription_ids_active 
      ON subscription_ids(subscription_id, is_active) 
    `);

    this.database.run(`
      CREATE INDEX IF NOT EXISTS idx_subscription_ids_expires 
      ON subscription_ids(expires_at) 
    `);

    this.database.run(`
      CREATE INDEX IF NOT EXISTS idx_booking_requests_created 
      ON booking_requests(created_at)
    `);

    this.database.run(`
      CREATE INDEX IF NOT EXISTS idx_booking_requests_subscription 
      ON booking_requests(subscription_id)
    `);

    console.info("✅ SQLite tables created successfully");
  }

  private async insertSampleData(): Promise<void> {
    if (!this.database) {
      throw new Error("Database not initialized");
    }

    // Check if data already exists
    const existingCount = this.database.exec(
      "SELECT COUNT(*) as count FROM subscription_ids",
    )[0];
    if (existingCount && existingCount.values[0][0] > 0) {
      console.info("📊 SQLite sample data already exists, skipping insertion");
      return;
    }

    // Insert sample subscription data from SUBSCRIPTION_IDS.md
    const subscriptions = [
      // Premium Members
      { id: "HYBABC1234567", name: "Kim Taehyung", type: "premium" },
      { id: "HYBGHI5555555", name: "Jeon Jungkook", type: "premium" },
      { id: "HYBPQR8888888", name: "Jung Hoseok", type: "premium" },
      { id: "HYBAAA6666666", name: "Park Chaeyoung", type: "premium" },
      { id: "HYBDDD1234321", name: "Hanni Pham", type: "premium" },

      // Elite Members
      { id: "HYBDEF9876543", name: "Park Jimin", type: "elite" },
      { id: "HYBJKL7777777", name: "Kim Namjoon", type: "elite" },
      { id: "HYBSTU1111111", name: "Kim Seokjin", type: "elite" },
      { id: "HYBYZZ4444444", name: "Kim Jennie", type: "elite" },
      { id: "HYBCCC0000000", name: "Minji Kim", type: "elite" },
      { id: "HYBFFF9012345", name: "Haerin Kang", type: "elite" },

      // Standard Members
      { id: "B07200EF6667", name: "Radhika Verma", type: "standard" },
      { id: "HYB10250GB0680", name: "Elisabete Magalhaes", type: "standard" },
      { id: "HYB59371A4C9F2", name: "MEGHANA VAISHNAVI", type: "standard" },
    ];

    const stmt = this.database.prepare(`
      INSERT INTO subscription_ids (subscription_id, user_name, subscription_type, expires_at)
      VALUES (?, ?, ?, ?)
    `);

    subscriptions.forEach((sub) => {
      const expiresAt =
        sub.type === "premium"
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
          : sub.type === "elite"
            ? new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString() // 6 months
            : null; // Standard never expires

      stmt.run([sub.id, sub.name, sub.type, expiresAt]);
    });

    stmt.free();
    this.saveToFile();
    console.info("📊 SQLite sample subscription data inserted successfully");
  }

  private saveToFile(): void {
    if (!this.database) return;

    try {
      const data = this.database.export();
      fs.writeFileSync(this.dbPath, data);
    } catch (error) {
      console.error("❌ Failed to save SQLite database to file:", error);
    }
  }

  // Subscription methods
  async validateSubscription(subscriptionId: string): Promise<{
    isValid: boolean;
    subscriptionType?: string;
    userName?: string;
    message: string;
  }> {
    if (!this.database) {
      await this.initialize();
    }

    if (!this.database) {
      return {
        isValid: false,
        message: "Database not available",
      };
    }

    try {
      const normalizedId = subscriptionId.trim().toUpperCase();

      const stmt = this.database.prepare(`
        SELECT subscription_id, user_name, subscription_type, is_active, expires_at, usage_count
        FROM subscription_ids
        WHERE subscription_id = ? AND is_active = 1
      `);

      const result = stmt.get([normalizedId]);
      stmt.free();

      if (!result) {
        return {
          isValid: false,
          message:
            "Subscription ID not found, inactive, or expired. Please check your ID and try again.",
        };
      }

      // Check expiration
      if (result[4] && new Date(result[4]) < new Date()) {
        return {
          isValid: false,
          message: "Subscription has expired. Please renew your membership.",
        };
      }

      // Update usage count and last used
      const updateStmt = this.database.prepare(`
        UPDATE subscription_ids 
        SET usage_count = usage_count + 1, last_used_at = CURRENT_TIMESTAMP
        WHERE subscription_id = ?
      `);
      updateStmt.run([normalizedId]);
      updateStmt.free();
      this.saveToFile();

      return {
        isValid: true,
        subscriptionType: result[2],
        userName: result[1],
        message: `Valid ${result[2]} subscription for ${result[1]}`,
      };
    } catch (error) {
      console.error("❌ Subscription validation error:", error);
      Analytics.trackError(error as Error, "sqlite_subscription_validation", {
        subscriptionId,
      });
      return {
        isValid: false,
        message: "Service temporarily unavailable. Please try again later.",
      };
    }
  }

  async getSubscriptionTypes(): Promise<{
    subscriptionTypes: Array<{ subscription_type: string; count: string }>;
    totalActive: number;
  }> {
    if (!this.database) {
      await this.initialize();
    }

    if (!this.database) {
      return { subscriptionTypes: [], totalActive: 0 };
    }

    try {
      const result = this.database.exec(`
        SELECT subscription_type, COUNT(*) as count
        FROM subscription_ids
        WHERE is_active = 1
        GROUP BY subscription_type
        ORDER BY subscription_type
      `);

      if (!result[0]) {
        return { subscriptionTypes: [], totalActive: 0 };
      }

      const subscriptionTypes = result[0].values.map((row) => ({
        subscription_type: row[0] as string,
        count: row[1] as string,
      }));

      const totalActive = subscriptionTypes.reduce(
        (sum, row) => sum + parseInt(row.count),
        0,
      );

      return { subscriptionTypes, totalActive };
    } catch (error) {
      console.error("❌ Error fetching subscription types:", error);
      return { subscriptionTypes: [], totalActive: 0 };
    }
  }

  // Booking methods
  async saveBooking(
    booking: Omit<BookingRecord, "id" | "created_at">,
  ): Promise<string> {
    if (!this.database) {
      await this.initialize();
    }

    if (!this.database) {
      throw new Error("Database not available");
    }

    try {
      const stmt = this.database.prepare(`
        INSERT INTO booking_requests (
          booking_id, celebrity, full_name, email, phone, organization,
          event_type, event_date, location, budget_range, custom_amount,
          attendees, special_requests, subscription_id, privacy_consent, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run([
        booking.booking_id,
        booking.celebrity,
        booking.full_name,
        booking.email,
        booking.phone,
        booking.organization || null,
        booking.event_type,
        booking.event_date || null,
        booking.location,
        booking.budget_range,
        booking.custom_amount || null,
        booking.attendees,
        booking.special_requests,
        booking.subscription_id || null,
        booking.privacy_consent ? 1 : 0,
        booking.status,
      ]);

      stmt.free();
      this.saveToFile();

      console.info(`✅ Booking saved to SQLite: ${booking.booking_id}`);
      return booking.booking_id;
    } catch (error) {
      console.error("❌ Error saving booking to SQLite:", error);
      Analytics.trackError(error as Error, "sqlite_booking_save", {
        bookingId: booking.booking_id,
      });
      throw error;
    }
  }

  async getBookings(limit = 50): Promise<BookingRecord[]> {
    if (!this.database) {
      await this.initialize();
    }

    if (!this.database) {
      return [];
    }

    try {
      const result = this.database.exec(`
        SELECT * FROM booking_requests
        ORDER BY created_at DESC
        LIMIT ${limit}
      `);

      if (!result[0]) {
        return [];
      }

      const columns = result[0].columns;
      return result[0].values.map((row) => {
        const booking: any = {};
        columns.forEach((col, index) => {
          booking[col] = row[index];
        });
        return booking as BookingRecord;
      });
    } catch (error) {
      console.error("❌ Error fetching bookings:", error);
      return [];
    }
  }

  async close(): Promise<void> {
    if (this.database) {
      this.database.close();
      this.database = null;
      console.info("🔒 SQLite database connection closed");
    }
  }

  async healthCheck(): Promise<{
    connected: boolean;
    totalSubscriptions: number;
    totalBookings: number;
    error?: string;
  }> {
    try {
      if (!this.database) {
        await this.initialize();
      }

      if (!this.database) {
        return {
          connected: false,
          totalSubscriptions: 0,
          totalBookings: 0,
          error: "Database initialization failed",
        };
      }

      const subResult = this.database.exec(
        "SELECT COUNT(*) FROM subscription_ids",
      );
      const bookingResult = this.database.exec(
        "SELECT COUNT(*) FROM booking_requests",
      );

      return {
        connected: true,
        totalSubscriptions: (subResult[0]?.values[0]?.[0] as number) || 0,
        totalBookings: (bookingResult[0]?.values[0]?.[0] as number) || 0,
      };
    } catch (error) {
      return {
        connected: false,
        totalSubscriptions: 0,
        totalBookings: 0,
        error: (error as Error).message,
      };
    }
  }
}

export const sqliteDb = SQLiteManager.getInstance();
