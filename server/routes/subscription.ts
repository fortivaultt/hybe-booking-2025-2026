import { RequestHandler } from "express";
import { Pool } from "pg";
import { cacheService } from "../utils/cache";
import { Analytics } from "../utils/logger";

// Initialize PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
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
  try {
    const { subscriptionId } = req.body as SubscriptionValidationRequest;

    // Input validation
    if (!subscriptionId || typeof subscriptionId !== 'string') {
      return res.json({
        isValid: false,
        message: "Invalid subscription ID provided."
      } as SubscriptionValidationResponse);
    }

    // Normalize input
    const normalizedId = subscriptionId.trim().toUpperCase();

    // Basic length and character validation
    if (normalizedId.length < 10 || normalizedId.length > 13) {
      return res.json({
        isValid: false,
        message: "Invalid subscription ID format."
      } as SubscriptionValidationResponse);
    }

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

    const result = await pool.query(query, [normalizedId]);

    if (result.rows.length === 0) {
      // Log failed attempts for security monitoring
      console.warn(`Failed subscription validation attempt: ${normalizedId} from IP: ${req.ip}`);

      return res.json({
        isValid: false,
        message: "Subscription ID not found, inactive, or expired. Please check your ID and try again."
      } as SubscriptionValidationResponse);
    }

    const subscription = result.rows[0];

    // Log successful validation for audit trail
    console.info(`Successful subscription validation: ${normalizedId} for user: ${subscription.user_name}`);

    return res.json({
      isValid: true,
      subscriptionType: subscription.subscription_type,
      userName: subscription.user_name,
      message: `Valid ${subscription.subscription_type} subscription for ${subscription.user_name}`
    } as SubscriptionValidationResponse);

  } catch (error) {
    console.error("Subscription validation error:", error);

    // Don't expose internal error details
    return res.status(500).json({
      isValid: false,
      message: "Service temporarily unavailable. Please try again later."
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
      totalActive: result.rows.reduce((sum, row) => sum + parseInt(row.count), 0)
    });

  } catch (error) {
    console.error("Error fetching subscription types:", error);
    res.status(500).json({
      error: "Failed to fetch subscription types"
    });
  }
};
