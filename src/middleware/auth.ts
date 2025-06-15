import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { AuthenticatedRequest, JwtPayload, ApiError, HttpStatus, ErrorCodes } from '../types';

/**
 * Authentication middleware to verify JWT tokens
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const error: ApiError = {
        success: false,
        message: 'Access token is required',
        error: ErrorCodes.AUTHENTICATION_ERROR
      };
      res.status(HttpStatus.UNAUTHORIZED).json(error);
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      const error: ApiError = {
        success: false,
        message: 'Access token is required',
        error: ErrorCodes.AUTHENTICATION_ERROR
      };
      res.status(HttpStatus.UNAUTHORIZED).json(error);
      return;
    }

    // Verify token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    } catch (jwtError) {
      let message = 'Invalid or expired token';
      
      if (jwtError instanceof jwt.TokenExpiredError) {
        message = 'Token has expired';
      } else if (jwtError instanceof jwt.JsonWebTokenError) {
        message = 'Invalid token format';
      }

      const error: ApiError = {
        success: false,
        message,
        error: ErrorCodes.AUTHENTICATION_ERROR
      };
      res.status(HttpStatus.UNAUTHORIZED).json(error);
      return;
    }

    // Get user from database
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: decoded.userId },
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'isActive', 'createdAt', 'updatedAt']
    });

    if (!user) {
      const error: ApiError = {
        success: false,
        message: 'User not found',
        error: ErrorCodes.AUTHENTICATION_ERROR
      };
      res.status(HttpStatus.UNAUTHORIZED).json(error);
      return;
    }

    if (!user.isActive) {
      const error: ApiError = {
        success: false,
        message: 'User account is deactivated',
        error: ErrorCodes.AUTHENTICATION_ERROR
      };
      res.status(HttpStatus.UNAUTHORIZED).json(error);
      return;
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    
    const apiError: ApiError = {
      success: false,
      message: 'Authentication failed',
      error: ErrorCodes.AUTHENTICATION_ERROR,
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    };
    
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(apiError);
  }
};

/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
export const optionalAuthenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No token provided, continue without authentication
    next();
    return;
  }

  // Token provided, use regular authentication
  await authenticate(req, res, next);
};

/**
 * Authorization middleware to check user roles
 */
export const authorize = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      const error: ApiError = {
        success: false,
        message: 'Authentication required',
        error: ErrorCodes.AUTHENTICATION_ERROR
      };
      res.status(HttpStatus.UNAUTHORIZED).json(error);
      return;
    }

    if (!roles.includes(req.user.role)) {
      const error: ApiError = {
        success: false,
        message: 'Insufficient permissions',
        error: ErrorCodes.AUTHORIZATION_ERROR
      };
      res.status(HttpStatus.FORBIDDEN).json(error);
      return;
    }

    next();
  };
};

/**
 * Middleware to ensure user can only access their own resources
 */
export const ensureOwnership = (userIdParam: string = 'userId') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      const error: ApiError = {
        success: false,
        message: 'Authentication required',
        error: ErrorCodes.AUTHENTICATION_ERROR
      };
      res.status(HttpStatus.UNAUTHORIZED).json(error);
      return;
    }

    const resourceUserId = req.params[userIdParam] || req.body[userIdParam];
    
    if (resourceUserId && resourceUserId !== req.user.id && req.user.role !== 'admin') {
      const error: ApiError = {
        success: false,
        message: 'Access denied: You can only access your own resources',
        error: ErrorCodes.AUTHORIZATION_ERROR
      };
      res.status(HttpStatus.FORBIDDEN).json(error);
      return;
    }

    next();
  };
};
