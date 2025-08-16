import { RequestHandler } from "express";
import { Pool } from "pg";

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
    
    // Validate input format first
    const subscriptionIdRegex = /^HYB[A-Z0-9]{10}$/i;
    if (!subscriptionId || !subscriptionIdRegex.test(subscriptionId)) {
      return res.json({
        isValid: false,
        message: "Invalid subscription ID format. Must start with HYB followed by 10 alphanumeric characters."
      } as SubscriptionValidationResponse);
    }

    // Check against database
    const query = `
      SELECT subscription_id, user_name, subscription_type, is_active 
      FROM subscription_ids 
      WHERE subscription_id = $1 AND is_active = true
    `;
    
    const result = await pool.query(query, [subscriptionId.toUpperCase()]);
    
    if (result.rows.length === 0) {
      return res.json({
        isValid: false,
        message: "Subscription ID not found or inactive. Please check your ID and try again."
      } as SubscriptionValidationResponse);
    }

    const subscription = result.rows[0];
    return res.json({
      isValid: true,
      subscriptionType: subscription.subscription_type,
      userName: subscription.user_name,
      message: `Valid ${subscription.subscription_type} subscription for ${subscription.user_name}`
    } as SubscriptionValidationResponse);

  } catch (error) {
    console.error("Subscription validation error:", error);
    return res.status(500).json({
      isValid: false,
      message: "An error occurred while validating the subscription ID. Please try again."
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
