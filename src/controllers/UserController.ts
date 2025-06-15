import { Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { AuthenticatedRequest, ApiResponse, HttpStatus } from '../types';
import { asyncHandler } from '../middleware/errorHandler';

export class UserController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * @swagger
   * /users/me:
   *   get:
   *     summary: Get current user profile
   *     tags: [Users]
   *     responses:
   *       200:
   *         description: User profile retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: User profile retrieved successfully
   *                 data:
   *                   $ref: '#/components/schemas/User'
   *       401:
   *         description: Unauthorized - Invalid or missing token
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: User not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const user = await this.authService.getUserProfile(req.user.id);

    const response: ApiResponse = {
      success: true,
      message: 'User profile retrieved successfully',
      data: user
    };

    res.status(HttpStatus.OK).json(response);
  });

  /**
   * @swagger
   * /users/me:
   *   put:
   *     summary: Update current user profile
   *     tags: [Users]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               firstName:
   *                 type: string
   *                 example: John
   *               lastName:
   *                 type: string
   *                 example: Doe
   *     responses:
   *       200:
   *         description: User profile updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: User profile updated successfully
   *                 data:
   *                   $ref: '#/components/schemas/User'
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: Unauthorized - Invalid or missing token
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: User not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const updatedUser = await this.authService.updateProfile(req.user.id, req.body);

    const response: ApiResponse = {
      success: true,
      message: 'User profile updated successfully',
      data: updatedUser
    };

    res.status(HttpStatus.OK).json(response);
  });

  /**
   * @swagger
   * /users/me:
   *   delete:
   *     summary: Deactivate current user account
   *     tags: [Users]
   *     responses:
   *       200:
   *         description: User account deactivated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: User account deactivated successfully
   *       401:
   *         description: Unauthorized - Invalid or missing token
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: User not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  deactivateAccount = asyncHandler(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    await this.authService.deactivateAccount(req.user.id);

    const response: ApiResponse = {
      success: true,
      message: 'User account deactivated successfully'
    };

    res.status(HttpStatus.OK).json(response);
  });
}
