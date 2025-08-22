import { Request, Response, NextFunction } from 'express';
import { Analytics } from '../utils/logger';
import { cacheService } from '../utils/cache';

interface ErrorWithStatus extends Error {
  status?: number;
  statusCode?: number;
}

interface ErrorReport {
  id: string;
  timestamp: string;
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  request: {
    method: string;
    url: string;
    ip: string;
    userAgent: string;
    headers: Record<string, any>;
    body?: any;
  };
  context: {
    userId?: string;
    sessionId?: string;
    environment: string;
    version?: string;
  };
}

export class ErrorTracker {
  private static instance: ErrorTracker;
  
  private constructor() {}
  
  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  async trackError(error: ErrorWithStatus, req: Request, additionalContext?: any): Promise<string> {
    const errorId = this.generateErrorId();
    
    const errorReport: ErrorReport = {
      id: errorId,
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      request: {
        method: req.method,
        url: req.originalUrl || req.url,
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        headers: this.sanitizeHeaders(req.headers),
        body: this.sanitizeBody(req.body),
      },
      context: {
        environment: process.env.NODE_ENV || 'unknown',
        version: process.env.npm_package_version || 'unknown',
        ...additionalContext,
      },
    };

    // Log the error
    Analytics.trackError(error, 'error_tracker', errorReport);

    // Cache error for debugging (expires in 24 hours)
    await cacheService.set(`error:${errorId}`, errorReport, 86400);

    // In production, you might want to send this to external services like Sentry, DataDog, etc.
    if (process.env.NODE_ENV === 'production') {
      await this.sendToExternalService(errorReport);
    }

    return errorId;
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sanitizeHeaders(headers: any): Record<string, any> {
    const sanitized = { ...headers };
    
    // Remove sensitive headers
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sanitized = { ...body };
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'otp', 'creditCard', 'ssn', 'token'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    // Partially redact email and phone if present
    if (sanitized.email && typeof sanitized.email === 'string') {
      sanitized.email = sanitized.email.replace(/(.{2}).*@/, '$1***@');
    }
    
    if (sanitized.phone && typeof sanitized.phone === 'string') {
      sanitized.phone = sanitized.phone.replace(/(\d{3})\d*(\d{4})/, '$1***$2');
    }

    return sanitized;
  }

  private async sendToExternalService(errorReport: ErrorReport): Promise<void> {
    // Placeholder for external error reporting services
    // Examples: Sentry, Rollbar, Bugsnag, DataDog, etc.
    
    try {
      // Example Sentry integration:
      // Sentry.captureException(new Error(errorReport.error.message), {
      //   extra: errorReport,
      //   tags: {
      //     errorId: errorReport.id,
      //     environment: errorReport.context.environment,
      //   },
      // });

      // Example webhook to external service:
      // await fetch(process.env.ERROR_WEBHOOK_URL!, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorReport),
      // });

      console.info(`Error report sent to external service: ${errorReport.id}`);
    } catch (externalError) {
      console.error('Failed to send error to external service:', externalError);
    }
  }

  async getErrorReport(errorId: string): Promise<ErrorReport | null> {
    return await cacheService.get<ErrorReport>(`error:${errorId}`);
  }

  // Health check for error tracking system
  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      const testErrorId = await this.trackError(
        new Error('Health check test error'), 
        {} as Request, 
        { healthCheck: true }
      );
      
      const retrieved = await this.getErrorReport(testErrorId);
      
      return {
        status: retrieved ? 'healthy' : 'degraded',
        details: {
          canTrack: !!testErrorId,
          canRetrieve: !!retrieved,
          cacheService: await cacheService.exists('health_check_key'),
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }
}

// Express middleware for automatic error tracking
export const errorTrackingMiddleware = (
  error: ErrorWithStatus,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errorTracker = ErrorTracker.getInstance();
  
  // Track the error asynchronously
  errorTracker.trackError(error, req).then(errorId => {
    // Add error ID to response headers for debugging
    res.set('X-Error-ID', errorId);
    
    // Determine status code
    const statusCode = error.status || error.statusCode || 500;
    
    // Send response
    if (!res.headersSent) {
      res.status(statusCode).json({
        error: true,
        message: process.env.NODE_ENV === 'production' 
          ? 'Internal server error' 
          : error.message,
        errorId: process.env.NODE_ENV === 'development' ? errorId : undefined,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
      });
    }
  }).catch(trackingError => {
    console.error('Error tracking failed:', trackingError);
    
    // Still send error response even if tracking fails
    if (!res.headersSent) {
      res.status(500).json({
        error: true,
        message: 'Internal server error',
      });
    }
  });
};

// Health check endpoint for error tracking
export const errorTrackingHealthCheck = async (req: Request, res: Response) => {
  const errorTracker = ErrorTracker.getInstance();
  const healthStatus = await errorTracker.healthCheck();
  
  res.status(healthStatus.status === 'healthy' ? 200 : 503).json({
    service: 'error-tracking',
    ...healthStatus,
    timestamp: new Date().toISOString(),
  });
};

export const errorTracker = ErrorTracker.getInstance();
