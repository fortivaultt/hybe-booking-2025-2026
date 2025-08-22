import { RequestHandler } from "express";
import { Pool } from "pg";
import { cacheService } from "../utils/cache";
import { Analytics } from "../utils/logger";

// Initialize PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

export interface SubscriptionValidationRequest {
  subscriptionId: string;
}

export interface SubscriptionValidationResponse {
  isValid: boolean;
  subscriptionType?: string;
  userName?: string;
  message: string;
}

export const validateSubscriptionId: RequestHandler = async (req, res) => {
  const startTime = Date.now();
  let cachedResult = false;

  try {
    const { subscriptionId } = req.body as SubscriptionValidationRequest;

    // Input validation
    if (!subscriptionId || typeof subscriptionId !== "string") {
      const response = {
        isValid: false,
        message: "Invalid subscription ID provided.",
      } as SubscriptionValidationResponse;

      Analytics.trackSubscriptionValidation(
        subscriptionId || "invalid",
        false,
        Date.now() - startTime,
        req.ip,
      );

      return res.json(response);
    }

    // Normalize input
    const normalizedId = subscriptionId.trim().toUpperCase();

    // Basic length and character validation
    if (normalizedId.length < 10 || normalizedId.length > 13) {
      const response = {
        isValid: false,
        message: "Invalid subscription ID format.",
      } as SubscriptionValidationResponse;

      Analytics.trackSubscriptionValidation(
        normalizedId,
        false,
        Date.now() - startTime,
        req.ip,
      );
      return res.json(response);
    }

    // Check cache first
    const cachedValidation =
      await cacheService.getCachedSubscriptionValidation(normalizedId);
    if (cachedValidation) {
      cachedResult = true;
      Analytics.trackCacheHit(`subscription:${normalizedId}`, true);
      Analytics.trackSubscriptionValidation(
        normalizedId,
        cachedValidation.isValid,
        Date.now() - startTime,
        req.ip,
      );

      return res.json(cachedValidation);
    }

    Analytics.trackCacheHit(`subscription:${normalizedId}`, false);

    // Check against database with enhanced query
    const query = `
      SELECT
        subscription_id,
        user_name,
        subscription_type,
        is_active,
        created_at,
        expires_at
      FROM subscription_ids
      WHERE subscription_id = $1
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
    `;

    const dbStartTime = Date.now();
    const result = await pool.query(query, [normalizedId]);
    Analytics.trackPerformance("database_query", Date.now() - dbStartTime, {
      query: "subscription_validation",
      resultCount: result.rows.length,
    });

    if (result.rows.length === 0) {
      const response = {
        isValid: false,
        message:
          "Subscription ID not found, inactive, or expired. Please check your ID and try again.",
      } as SubscriptionValidationResponse;

      // Cache negative results for shorter duration to avoid DoS via cache pollution
      await cacheService.cacheSubscriptionValidation(
        normalizedId,
        response,
        60,
      ); // 1 minute

      Analytics.trackSubscriptionValidation(
        normalizedId,
        false,
        Date.now() - startTime,
        req.ip,
      );

      return res.json(response);
    }

    const subscription = result.rows[0];

    const response = {
      isValid: true,
      subscriptionType: subscription.subscription_type,
      userName: subscription.user_name,
      message: `Valid ${subscription.subscription_type} subscription for ${subscription.user_name}`,
    } as SubscriptionValidationResponse;

    // Cache successful results for longer duration
    await cacheService.cacheSubscriptionValidation(normalizedId, response, 300); // 5 minutes

    Analytics.trackSubscriptionValidation(
      normalizedId,
      true,
      Date.now() - startTime,
      req.ip,
    );

    return res.json(response);
  } catch (error) {
    Analytics.trackError(error as Error, "subscription_validation", {
      subscriptionId: req.body?.subscriptionId,
      ip: req.ip,
      cached: cachedResult,
    });

    // Don't expose internal error details
    return res.status(500).json({
      isValid: false,
      message: "Service temporarily unavailable. Please try again later.",
    } as SubscriptionValidationResponse);
  }
};

export const listSubscriptionTypes: RequestHandler = async (req, res) => {
  try {
    const query = `
      SELECT subscription_type, COUNT(*) as count 
      FROM subscription_ids 
      WHERE is_active = true 
      GROUP BY subscription_type 
      ORDER BY subscription_type
    `;

    const result = await pool.query(query);

    res.json({
      subscriptionTypes: result.rows,
      totalActive: result.rows.reduce(
        (sum, row) => sum + parseInt(row.count),
        0,
      ),
    });
  } catch (error) {
    console.error("Error fetching subscription types:", error);
    res.status(500).json({
      error: "Failed to fetch subscription types",
    });
  }
};
