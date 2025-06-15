import { Request, Response, NextFunction } from 'express';
import { QueryFailedError } from 'typeorm';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { ApiError, HttpStatus, ErrorCodes } from '../types';

/**
 * Global error handler middleware
 */
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
    timestamp: new Date().toISOString()
  });

  // Default error response
  let apiError: ApiError = {
    success: false,
    message: 'Internal server error',
    error: ErrorCodes.INTERNAL_ERROR
  };

  let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;

  // Handle specific error types
  if (error instanceof QueryFailedError) {
    // Database errors
    statusCode = HttpStatus.BAD_REQUEST;
    apiError = {
      success: false,
      message: 'Database operation failed',
      error: ErrorCodes.DATABASE_ERROR,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    };

    // Handle specific database constraint violations
    if (error.message.includes('duplicate key value')) {
      statusCode = HttpStatus.CONFLICT;
      apiError.message = 'Resource already exists';
      apiError.error = ErrorCodes.DUPLICATE_RESOURCE;
      
      // Extract field name from error message if possible
      const match = error.message.match(/Key \(([^)]+)\)/);
      if (match) {
        apiError.details = `Duplicate value for field: ${match[1]}`;
      }
    } else if (error.message.includes('foreign key constraint')) {
      apiError.message = 'Referenced resource does not exist';
      apiError.error = ErrorCodes.NOT_FOUND;
    } else if (error.message.includes('not null constraint')) {
      statusCode = HttpStatus.UNPROCESSABLE_ENTITY;
      apiError.message = 'Required field is missing';
      apiError.error = ErrorCodes.VALIDATION_ERROR;
    }
  } else if (error instanceof TokenExpiredError) {
    // JWT token expired
    statusCode = HttpStatus.UNAUTHORIZED;
    apiError = {
      success: false,
      message: 'Token has expired',
      error: ErrorCodes.AUTHENTICATION_ERROR
    };
  } else if (error instanceof JsonWebTokenError) {
    // JWT token invalid
    statusCode = HttpStatus.UNAUTHORIZED;
    apiError = {
      success: false,
      message: 'Invalid token',
      error: ErrorCodes.AUTHENTICATION_ERROR
    };
  } else if (error.name === 'ValidationError') {
    // Validation errors (from class-validator or custom validation)
    statusCode = HttpStatus.UNPROCESSABLE_ENTITY;
    apiError = {
      success: false,
      message: 'Validation failed',
      error: ErrorCodes.VALIDATION_ERROR,
      details: error.message
    };
  } else if (error.name === 'CastError') {
    // Invalid ID format
    statusCode = HttpStatus.BAD_REQUEST;
    apiError = {
      success: false,
      message: 'Invalid ID format',
      error: ErrorCodes.VALIDATION_ERROR
    };
  } else if (error.code === 'ECONNREFUSED') {
    // Database connection error
    statusCode = HttpStatus.SERVICE_UNAVAILABLE;
    apiError = {
      success: false,
      message: 'Database connection failed',
      error: ErrorCodes.DATABASE_ERROR
    };
  } else if (error.code === 'ENOTFOUND') {
    // DNS resolution error
    statusCode = HttpStatus.SERVICE_UNAVAILABLE;
    apiError = {
      success: false,
      message: 'Service unavailable',
      error: ErrorCodes.INTERNAL_ERROR
    };
  } else if (error.status || error.statusCode) {
    // HTTP errors with status codes
    statusCode = error.status || error.statusCode;
    apiError = {
      success: false,
      message: error.message || 'Request failed',
      error: getErrorCodeFromStatus(statusCode)
    };
  } else if (error.message) {
    // Generic errors with custom messages
    apiError.message = error.message;
    
    // Try to determine appropriate status code from message
    if (error.message.toLowerCase().includes('not found')) {
      statusCode = HttpStatus.NOT_FOUND;
      apiError.error = ErrorCodes.NOT_FOUND;
    } else if (error.message.toLowerCase().includes('unauthorized')) {
      statusCode = HttpStatus.UNAUTHORIZED;
      apiError.error = ErrorCodes.AUTHENTICATION_ERROR;
    } else if (error.message.toLowerCase().includes('forbidden')) {
      statusCode = HttpStatus.FORBIDDEN;
      apiError.error = ErrorCodes.AUTHORIZATION_ERROR;
    } else if (error.message.toLowerCase().includes('validation')) {
      statusCode = HttpStatus.UNPROCESSABLE_ENTITY;
      apiError.error = ErrorCodes.VALIDATION_ERROR;
    }
  }

  // Add stack trace in development mode
  if (process.env.NODE_ENV === 'development') {
    apiError.stack = error.stack;
  }

  // Send error response
  res.status(statusCode).json(apiError);
};

/**
 * Helper function to map HTTP status codes to error codes
 */
function getErrorCodeFromStatus(status: number): string {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return ErrorCodes.VALIDATION_ERROR;
    case HttpStatus.UNAUTHORIZED:
      return ErrorCodes.AUTHENTICATION_ERROR;
    case HttpStatus.FORBIDDEN:
      return ErrorCodes.AUTHORIZATION_ERROR;
    case HttpStatus.NOT_FOUND:
      return ErrorCodes.NOT_FOUND;
    case HttpStatus.CONFLICT:
      return ErrorCodes.DUPLICATE_RESOURCE;
    case HttpStatus.UNPROCESSABLE_ENTITY:
      return ErrorCodes.VALIDATION_ERROR;
    case HttpStatus.TOO_MANY_REQUESTS:
      return ErrorCodes.RATE_LIMIT_EXCEEDED;
    default:
      return ErrorCodes.INTERNAL_ERROR;
  }
}

/**
 * Async error wrapper for route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Custom error class for application-specific errors
 */
export class AppError extends Error {
  public statusCode: number;
  public errorCode: string;
  public isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
    errorCode: string = ErrorCodes.INTERNAL_ERROR,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Helper functions to create specific error types
 */
export const createNotFoundError = (resource: string = 'Resource'): AppError => {
  return new AppError(
    `${resource} not found`,
    HttpStatus.NOT_FOUND,
    ErrorCodes.NOT_FOUND
  );
};

export const createValidationError = (message: string): AppError => {
  return new AppError(
    message,
    HttpStatus.UNPROCESSABLE_ENTITY,
    ErrorCodes.VALIDATION_ERROR
  );
};

export const createAuthenticationError = (message: string = 'Authentication failed'): AppError => {
  return new AppError(
    message,
    HttpStatus.UNAUTHORIZED,
    ErrorCodes.AUTHENTICATION_ERROR
  );
};

export const createAuthorizationError = (message: string = 'Access denied'): AppError => {
  return new AppError(
    message,
    HttpStatus.FORBIDDEN,
    ErrorCodes.AUTHORIZATION_ERROR
  );
};

export const createDuplicateResourceError = (resource: string = 'Resource'): AppError => {
  return new AppError(
    `${resource} already exists`,
    HttpStatus.CONFLICT,
    ErrorCodes.DUPLICATE_RESOURCE
  );
};
