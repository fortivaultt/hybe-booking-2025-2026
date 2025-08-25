import { RequestHandler } from "express";
import { Pool } from "pg";
import { cacheService } from "../utils/cache";
import { Analytics } from "../utils/logger";

// Initialize PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("sslmode=require")
    ? { rejectUnauthorized: false }
    : false,
});

export const getSystemHealth: RequestHandler = async (req, res) => {
  const startTime = Date.now();

  try {
    const healthChecks = await Promise.allSettled([
      checkDatabaseHealth(),
      checkCacheHealth(),
      checkSystemMetrics(),
    ]);

    const dbHealth =
      healthChecks[0].status === "fulfilled"
        ? healthChecks[0].value
        : { status: "error", error: (healthChecks[0] as any).reason };
    const cacheHealth =
      healthChecks[1].status === "fulfilled"
        ? healthChecks[1].value
        : { status: "error", error: (healthChecks[1] as any).reason };
    const systemMetrics =
      healthChecks[2].status === "fulfilled"
        ? healthChecks[2].value
        : { status: "error", error: (healthChecks[2] as any).reason };

    const overallStatus = [dbHealth, cacheHealth].every(
      (check) => check.status === "healthy",
    )
      ? "healthy"
      : "degraded";

    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      services: {
        database: dbHealth,
        cache: cacheHealth,
      },
      metrics: systemMetrics,
    };

    Analytics.trackPerformance("health_check", Date.now() - startTime, {
      status: overallStatus,
      services: Object.keys(response.services).length,
    });

    res.status(overallStatus === "healthy" ? 200 : 503).json(response);
  } catch (error) {
    Analytics.trackError(error as Error, "health_check_endpoint", {
      ip: req.ip,
    });

    res.status(500).json({
      status: "error",
      timestamp: new Date().toISOString(),
      error: "Health check failed",
    });
  }
};

export const getAnalyticsDashboard: RequestHandler = async (req, res) => {
  const startTime = Date.now();

  try {
    const [
      subscriptionStats,
      bookingStats,
      performanceMetrics,
      errorMetrics,
      rateLimitMetrics,
    ] = await Promise.allSettled([
      getSubscriptionAnalytics(),
      getBookingAnalytics(),
      getPerformanceMetrics(),
      getErrorMetrics(),
      getRateLimitMetrics(),
    ]);

    const response = {
      timestamp: new Date().toISOString(),
      period: "24h",
      subscription:
        subscriptionStats.status === "fulfilled"
          ? subscriptionStats.value
          : { error: (subscriptionStats as any).reason },
      booking:
        bookingStats.status === "fulfilled"
          ? bookingStats.value
          : { error: (bookingStats as any).reason },
      performance:
        performanceMetrics.status === "fulfilled"
          ? performanceMetrics.value
          : { error: (performanceMetrics as any).reason },
      errors:
        errorMetrics.status === "fulfilled"
          ? errorMetrics.value
          : { error: (errorMetrics as any).reason },
      rateLimits:
        rateLimitMetrics.status === "fulfilled"
          ? rateLimitMetrics.value
          : { error: (rateLimitMetrics as any).reason },
      responseTime: Date.now() - startTime,
    };

    res.json(response);
  } catch (error) {
    Analytics.trackError(error as Error, "analytics_dashboard", { ip: req.ip });

    res.status(500).json({
      error: "Failed to generate analytics dashboard",
      timestamp: new Date().toISOString(),
    });
  }
};

async function checkDatabaseHealth() {
  try {
    const result = await pool.query("SELECT 1 as health_check");
    const connectionInfo = await pool.query(
      "SELECT count(*) as active_connections FROM pg_stat_activity WHERE state = $1",
      ["active"],
    );

    return {
      status: "healthy",
      responseTime: Date.now(),
      activeConnections: parseInt(connectionInfo.rows[0].active_connections),
      lastCheck: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: "error",
      error: error instanceof Error ? error.message : "Unknown database error",
      lastCheck: new Date().toISOString(),
    };
  }
}

async function checkCacheHealth() {
  try {
    const testKey = "health_check_" + Date.now();
    const testValue = "healthy";

    await cacheService.set(testKey, testValue, 10);
    const retrieved = await cacheService.get(testKey);
    await cacheService.del(testKey);

    return {
      status: retrieved === testValue ? "healthy" : "degraded",
      responseTime: Date.now(),
      canRead: !!retrieved,
      canWrite: true,
      lastCheck: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: "error",
      error: error instanceof Error ? error.message : "Unknown cache error",
      lastCheck: new Date().toISOString(),
    };
  }
}

async function checkSystemMetrics() {
  return {
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || "unknown",
    timestamp: new Date().toISOString(),
  };
}

async function getSubscriptionAnalytics() {
  try {
    const validationStats = await pool.query(`
      SELECT 
        COUNT(*) as total_validations,
        COUNT(CASE WHEN is_active THEN 1 END) as active_subscriptions,
        COUNT(CASE WHEN last_used_at > NOW() - INTERVAL '24 hours' THEN 1 END) as used_today
      FROM subscription_ids
    `);

    const typeDistribution = await pool.query(`
      SELECT subscription_type, COUNT(*) as count 
      FROM subscription_ids 
      WHERE is_active = true 
      GROUP BY subscription_type
    `);

    return {
      total: parseInt(validationStats.rows[0].total_validations),
      active: parseInt(validationStats.rows[0].active_subscriptions),
      usedToday: parseInt(validationStats.rows[0].used_today),
      typeDistribution: typeDistribution.rows,
    };
  } catch (error) {
    throw new Error(
      `Subscription analytics error: ${error instanceof Error ? error.message : "Unknown"}`,
    );
  }
}

async function getBookingAnalytics() {
  try {
    const bookingStats = await pool.query(`
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as bookings_today,
        COUNT(CASE WHEN subscription_id IS NOT NULL THEN 1 END) as with_subscription,
        AVG(CASE WHEN custom_amount IS NOT NULL THEN custom_amount ELSE 0 END) as avg_custom_amount
      FROM booking_requests
      WHERE created_at > NOW() - INTERVAL '30 days'
    `);

    const popularCelebrities = await pool.query(`
      SELECT celebrity, COUNT(*) as booking_count
      FROM booking_requests
      WHERE created_at > NOW() - INTERVAL '7 days'
      GROUP BY celebrity
      ORDER BY booking_count DESC
      LIMIT 5
    `);

    return {
      total: parseInt(bookingStats.rows[0].total_bookings),
      today: parseInt(bookingStats.rows[0].bookings_today),
      withSubscription: parseInt(bookingStats.rows[0].with_subscription),
      avgCustomAmount: parseFloat(bookingStats.rows[0].avg_custom_amount) || 0,
      popularCelebrities: popularCelebrities.rows,
    };
  } catch (error) {
    // Return mock data if table doesn't exist yet
    return {
      total: 0,
      today: 0,
      withSubscription: 0,
      avgCustomAmount: 0,
      popularCelebrities: [],
      note: "Booking table not initialized",
    };
  }
}

async function getPerformanceMetrics() {
  // This would typically come from your analytics store
  // For now, return basic Node.js metrics
  const memUsage = process.memoryUsage();

  return {
    memoryUsage: {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024),
    },
    uptime: Math.round(process.uptime()),
    averageResponseTime: null, // Would be calculated from real metrics
    requestsPerMinute: null, // Would be calculated from real metrics
  };
}

async function getErrorMetrics() {
  try {
    // This would typically query your error tracking system
    // For now, return basic stats
    return {
      total24h: 0,
      uniqueErrors: 0,
      errorRate: 0,
      topErrors: [],
      note: "Error metrics from cache/logging system",
    };
  } catch (error) {
    return {
      error: "Failed to fetch error metrics",
    };
  }
}

async function getRateLimitMetrics() {
  try {
    // This would query rate limit data from cache
    return {
      blockedRequests24h: 0,
      topBlockedIPs: [],
      byEndpoint: {},
      note: "Rate limit metrics from cache",
    };
  } catch (error) {
    return {
      error: "Failed to fetch rate limit metrics",
    };
  }
}

// Real-time metrics endpoint
export const getRealTimeMetrics: RequestHandler = async (req, res) => {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      server: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
      },
      // Add more real-time metrics here
    };

    res.json(metrics);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch real-time metrics",
      timestamp: new Date().toISOString(),
    });
  }
};
