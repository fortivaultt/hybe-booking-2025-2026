import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../utils/cache';

interface RateLimitOptions {
  windowMs: number;       // Time window in milliseconds
  maxRequests: number;    // Maximum requests per window
  message?: string;       // Custom error message
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  keyGenerator?: (req: Request) => string; // Custom key generator
}

interface RateLimitData {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private options: Required<RateLimitOptions>;

  constructor(options: RateLimitOptions) {
    this.options = {
      message: 'Too many requests, please try again later.',
      skipSuccessfulRequests: false,
      keyGenerator: (req: Request) => req.ip || 'anonymous',
      ...options,
    };
  }

  middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const key = `rate_limit:${this.options.keyGenerator(req)}`;
        const now = Date.now();
        const windowStart = now - this.options.windowMs;

        // Get current rate limit data
        const currentData = await cacheService.get<RateLimitData>(key);

        let count = 1;
        let resetTime = now + this.options.windowMs;

        if (currentData) {
          if (currentData.resetTime > now) {
            // Within the current window
            count = currentData.count + 1;
            resetTime = currentData.resetTime;
          } else {
            // Start new window
            count = 1;
            resetTime = now + this.options.windowMs;
          }
        }

        // Check if limit exceeded
        if (count > this.options.maxRequests) {
          const retryAfter = Math.ceil((resetTime - now) / 1000);
          
          res.set({
            'X-RateLimit-Limit': this.options.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(resetTime).toISOString(),
            'Retry-After': retryAfter.toString(),
          });

          return res.status(429).json({
            error: 'Rate limit exceeded',
            message: this.options.message,
            retryAfter,
          });
        }

        // Update rate limit data
        const ttlSeconds = Math.ceil(this.options.windowMs / 1000);
        await cacheService.set(key, { count, resetTime }, ttlSeconds);

        // Set response headers
        res.set({
          'X-RateLimit-Limit': this.options.maxRequests.toString(),
          'X-RateLimit-Remaining': (this.options.maxRequests - count).toString(),
          'X-RateLimit-Reset': new Date(resetTime).toISOString(),
        });

        // Store original end function to handle skipSuccessfulRequests
        if (this.options.skipSuccessfulRequests) {
          const originalEnd = res.end;
          res.end = function(this: Response, ...args: any[]) {
            // If response is successful, decrement the counter
            if (res.statusCode < 400) {
              cacheService.set(key, { 
                count: Math.max(0, count - 1), 
                resetTime 
              }, ttlSeconds).catch(console.error);
            }
            return originalEnd.apply(this, args);
          };
        }

        next();
      } catch (error) {
        console.error('Rate limiter error:', error);
        // Don't block requests if rate limiter fails
        next();
      }
    };
  }
}

// Pre-configured rate limiters
export const generalRateLimit = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  message: 'Too many requests from this IP, please try again later.',
});

export const subscriptionValidationRateLimit = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10,
  message: 'Too many subscription validation attempts, please try again later.',
  skipSuccessfulRequests: true,
});

export const otpRateLimit = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 3,
  message: 'Too many OTP requests, please wait before requesting again.',
  keyGenerator: (req: Request) => `${req.ip}:${req.body?.email || 'anonymous'}`,
});

export const bookingSubmissionRateLimit = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5,
  message: 'Too many booking submissions, please try again later.',
});
