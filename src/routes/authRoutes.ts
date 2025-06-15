import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { validate, authSchemas } from '../middleware/validation';
import { authRateLimiter } from '../middleware/rateLimiter';

const router = Router();
const authController = new AuthController();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and authorization endpoints
 */

// Apply rate limiting to all auth routes
router.use(authRateLimiter);

/**
 * POST /auth/signup
 * Register a new user
 */
router.post(
  '/signup',
  validate(authSchemas.signup),
  authController.signup
);

/**
 * POST /auth/login
 * Authenticate user and get JWT token
 */
router.post(
  '/login',
  validate(authSchemas.login),
  authController.login
);

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 */
router.post(
  '/refresh',
  authController.refreshToken
);

/**
 * POST /auth/logout
 * Logout user (client-side token removal)
 */
router.post(
  '/logout',
  authController.logout
);

export default router;
