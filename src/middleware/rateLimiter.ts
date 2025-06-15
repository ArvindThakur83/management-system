import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { ApiError, HttpStatus, ErrorCodes } from '../types';

/**
 * Rate limiting configuration
 */
const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'); // 15 minutes
const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'); // 100 requests per window

/**
 * Custom rate limit handler
 */
const rateLimitHandler = (_req: Request, res: Response): void => {
  const error: ApiError = {
    success: false,
    message: 'Too many requests from this IP, please try again later',
    error: ErrorCodes.RATE_LIMIT_EXCEEDED,
    details: `Rate limit: ${maxRequests} requests per ${windowMs / 1000 / 60} minutes`
  };

  res.status(HttpStatus.TOO_MANY_REQUESTS).json(error);
};

/**
 * Skip rate limiting for certain conditions
 */
const skipRateLimit = (req: Request): boolean => {
  // Skip rate limiting in test environment
  if (process.env.NODE_ENV === 'test') {
    return true;
  }

  // Skip rate limiting for health check endpoint
  if (req.path === '/health') {
    return true;
  }

  // Skip rate limiting for API documentation
  if (req.path.startsWith('/api-docs')) {
    return true;
  }

  return false;
};

/**
 * Generate key for rate limiting (by IP address)
 */
const keyGenerator = (req: Request): string => {
  // Use X-Forwarded-For header if behind a proxy, otherwise use connection IP
  const forwarded = req.headers['x-forwarded-for'] as string;
  const ip = forwarded ? forwarded.split(',')[0]!.trim() : req.connection.remoteAddress;
  return ip || 'unknown';
};

/**
 * Main rate limiter middleware
 */
export const rateLimiter = rateLimit({
  windowMs,
  max: maxRequests,
  message: rateLimitHandler,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: skipRateLimit,
  keyGenerator,
  // Custom store can be added here for Redis or other backends
  // store: new RedisStore({ ... })
});

/**
 * Stricter rate limiter for authentication endpoints
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: (_req: Request, res: Response): void => {
    const error: ApiError = {
      success: false,
      message: 'Too many authentication attempts, please try again later',
      error: ErrorCodes.RATE_LIMIT_EXCEEDED,
      details: 'Rate limit: 5 attempts per 15 minutes'
    };
    res.status(HttpStatus.TOO_MANY_REQUESTS).json(error);
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (_req: Request): boolean => process.env.NODE_ENV === 'test',
  keyGenerator
});

/**
 * Rate limiter for password reset endpoints
 */
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message: (_req: Request, res: Response): void => {
    const error: ApiError = {
      success: false,
      message: 'Too many password reset attempts, please try again later',
      error: ErrorCodes.RATE_LIMIT_EXCEEDED,
      details: 'Rate limit: 3 attempts per hour'
    };
    res.status(HttpStatus.TOO_MANY_REQUESTS).json(error);
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (_req: Request): boolean => process.env.NODE_ENV === 'test',
  keyGenerator
});
