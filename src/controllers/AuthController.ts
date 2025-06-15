import { Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { AuthenticatedRequest, ApiResponse, HttpStatus } from '../types';
import { asyncHandler } from '../middleware/errorHandler';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * @swagger
   * /auth/signup:
   *   post:
   *     summary: Register a new user
   *     tags: [Authentication]
   *     security: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *               - firstName
   *               - lastName
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: john.doe@example.com
   *               password:
   *                 type: string
   *                 minLength: 8
   *                 example: SecurePass123!
   *               firstName:
   *                 type: string
   *                 example: John
   *               lastName:
   *                 type: string
   *                 example: Doe
   *     responses:
   *       201:
   *         description: User registered successfully
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
   *                   example: User registered successfully
   *                 data:
   *                   type: object
   *                   properties:
   *                     user:
   *                       $ref: '#/components/schemas/User'
   *                     token:
   *                       type: string
   *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   *                     refreshToken:
   *                       type: string
   *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       409:
   *         description: User already exists
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  signup = asyncHandler(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    const authResponse = await this.authService.signup(req.body);

    const response: ApiResponse = {
      success: true,
      message: 'User registered successfully',
      data: authResponse
    };

    res.status(HttpStatus.CREATED).json(response);
  });

  /**
   * @swagger
   * /auth/login:
   *   post:
   *     summary: Authenticate user and get JWT token
   *     tags: [Authentication]
   *     security: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: john.doe@example.com
   *               password:
   *                 type: string
   *                 example: SecurePass123!
   *     responses:
   *       200:
   *         description: Login successful
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
   *                   example: Login successful
   *                 data:
   *                   type: object
   *                   properties:
   *                     user:
   *                       $ref: '#/components/schemas/User'
   *                     token:
   *                       type: string
   *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   *                     refreshToken:
   *                       type: string
   *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: Invalid credentials
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  login = asyncHandler(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    const authResponse = await this.authService.login(req.body);

    const response: ApiResponse = {
      success: true,
      message: 'Login successful',
      data: authResponse
    };

    res.status(HttpStatus.OK).json(response);
  });

  /**
   * @swagger
   * /auth/refresh:
   *   post:
   *     summary: Refresh access token
   *     tags: [Authentication]
   *     security: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - refreshToken
   *             properties:
   *               refreshToken:
   *                 type: string
   *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   *     responses:
   *       200:
   *         description: Token refreshed successfully
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
   *                   example: Token refreshed successfully
   *                 data:
   *                   type: object
   *                   properties:
   *                     token:
   *                       type: string
   *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   *                     refreshToken:
   *                       type: string
   *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   *       401:
   *         description: Invalid refresh token
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  refreshToken = asyncHandler(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    const { refreshToken } = req.body;
    const tokens = await this.authService.refreshToken(refreshToken);

    const response: ApiResponse = {
      success: true,
      message: 'Token refreshed successfully',
      data: tokens
    };

    res.status(HttpStatus.OK).json(response);
  });

  /**
   * @swagger
   * /auth/logout:
   *   post:
   *     summary: Logout user (client-side token removal)
   *     tags: [Authentication]
   *     responses:
   *       200:
   *         description: Logout successful
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
   *                   example: Logout successful
   */
  logout = asyncHandler(async (_req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    // In a JWT-based system, logout is typically handled client-side
    // by removing the token from storage. Server-side logout would require
    // token blacklisting, which is not implemented in this basic version.
    
    const response: ApiResponse = {
      success: true,
      message: 'Logout successful. Please remove the token from client storage.'
    };

    res.status(HttpStatus.OK).json(response);
  });
}
