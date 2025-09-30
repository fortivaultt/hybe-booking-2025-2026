import { RequestHandler } from "express";
import { cacheService } from "../utils/cache";
import { Analytics } from "../utils/logger";
import { db } from "../utils/db-provider";

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
    if (normalizedId.length < 10 || normalizedId.length > 14) {
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

    // Validate against database (Supabase or SQLite)
    const dbStartTime = Date.now();
    const validationResult = await db.validateSubscription(normalizedId);
    Analytics.trackPerformance("database_query", Date.now() - dbStartTime, {
      query: "subscription_validation",
      success: validationResult.isValid,
    });

    if (!validationResult.isValid) {
      const response = {
        isValid: false,
        message: validationResult.message,
      } as SubscriptionValidationResponse;

      // Cache negative results for shorter duration to avoid DoS via cache pollution
      cacheService.cacheSubscriptionValidation(normalizedId, response, 60); // 1 minute

      Analytics.trackSubscriptionValidation(
        normalizedId,
        false,
        Date.now() - startTime,
        req.ip,
      );

      return res.json(response);
    }

    const response = {
      isValid: true,
      subscriptionType: validationResult.subscriptionType,
      userName: validationResult.userName,
      message: validationResult.message,
    } as SubscriptionValidationResponse;

    // Cache successful results for longer duration
    cacheService.cacheSubscriptionValidation(normalizedId, response, 300); // 5 minutes

    Analytics.trackSubscriptionValidation(
      normalizedId,
      true,
      Date.now() - startTime,
      req.ip,
    );

    return res.json(response);
  } catch (error) {
    console.error("Subscription validation error:", error);
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
    const result = await db.getSubscriptionTypes();
    res.json(result);
  } catch (error) {
    console.error("Error fetching subscription types:", error);
    Analytics.trackError(error as Error, "subscription_types", {
      context: "list_subscription_types",
    });
    res.status(500).json({
      error: "Failed to fetch subscription types",
    });
  }
};
