import { Request, Response, NextFunction } from 'express';
import { ApiError, HttpStatus, ErrorCodes } from '../types';

/**
 * 404 Not Found handler middleware
 * This middleware is called when no route matches the request
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const error: ApiError = {
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    error: ErrorCodes.NOT_FOUND,
    details: process.env.NODE_ENV === 'development' 
      ? `Available routes can be found in the API documentation at ${req.protocol}://${req.get('host')}/api-docs`
      : undefined
  };

  res.status(HttpStatus.NOT_FOUND).json(error);
};
