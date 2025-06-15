import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import Joi from 'joi';

const router = Router();
const userController = new UserController();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User profile management endpoints
 */

// Apply authentication to all user routes
router.use(authenticate);

// User profile update validation schema
const updateProfileSchema = Joi.object({
  firstName: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .pattern(/^[a-zA-Z\s'-]+$/)
    .optional()
    .messages({
      'string.min': 'First name cannot be empty',
      'string.max': 'First name must not exceed 100 characters',
      'string.pattern.base': 'First name can only contain letters, spaces, hyphens, and apostrophes'
    }),
  
  lastName: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .pattern(/^[a-zA-Z\s'-]+$/)
    .optional()
    .messages({
      'string.min': 'Last name cannot be empty',
      'string.max': 'Last name must not exceed 100 characters',
      'string.pattern.base': 'Last name can only contain letters, spaces, hyphens, and apostrophes'
    })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

/**
 * GET /users/me
 * Get current user profile
 */
router.get('/me', userController.getProfile);

/**
 * PUT /users/me
 * Update current user profile
 */
router.put(
  '/me',
  validate(updateProfileSchema),
  userController.updateProfile
);

/**
 * DELETE /users/me
 * Deactivate current user account
 */
router.delete('/me', userController.deactivateAccount);

export default router;
