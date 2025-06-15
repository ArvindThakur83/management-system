import jwt from 'jsonwebtoken';
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { 
  SignupRequest, 
  LoginRequest, 
  AuthResponse, 
  JwtPayload,
  UserRole 
} from '../types';
import {
  createNotFoundError,
  createAuthenticationError,
  createDuplicateResourceError
} from '../middleware/errorHandler';

export class AuthService {
  private userRepository: Repository<User>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
  }

  /**
   * Register a new user
   */
  async signup(signupData: SignupRequest): Promise<AuthResponse> {
    const { email, password, firstName, lastName } = signupData;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      throw createDuplicateResourceError('User with this email');
    }

    // Create new user
    const user = this.userRepository.create({
      email: email.toLowerCase(),
      password,
      firstName,
      lastName,
      role: UserRole.USER,
      isActive: true
    });

    // Save user to database
    const savedUser = await this.userRepository.save(user);

    // Generate JWT token
    const token = this.generateAccessToken(savedUser);
    const refreshToken = this.generateRefreshToken(savedUser);

    // Update last login
    savedUser.updateLastLogin();
    await this.userRepository.save(savedUser);

    // Return response without password
    const { password: _, ...userWithoutPassword } = savedUser;

    return {
      user: userWithoutPassword,
      token,
      refreshToken
    };
  }

  /**
   * Authenticate user login
   */
  async login(loginData: LoginRequest): Promise<AuthResponse> {
    const { email, password } = loginData;

    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
      select: ['id', 'email', 'password', 'firstName', 'lastName', 'role', 'isActive', 'createdAt', 'updatedAt']
    });

    if (!user) {
      throw createAuthenticationError('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw createAuthenticationError('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw createAuthenticationError('Invalid email or password');
    }

    // Generate JWT tokens
    const token = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Update last login
    user.updateLastLogin();
    await this.userRepository.save(user);

    // Return response without password
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
      refreshToken
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    try {
      const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
      if (!jwtRefreshSecret) {
        throw new Error('JWT_REFRESH_SECRET is not configured');
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, jwtRefreshSecret) as JwtPayload;

      // Find user
      const user = await this.userRepository.findOne({
        where: { id: decoded.userId }
      });

      if (!user || !user.isActive) {
        throw createAuthenticationError('Invalid refresh token');
      }

      // Generate new tokens
      const newAccessToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

      return {
        token: newAccessToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      throw createAuthenticationError('Invalid refresh token');
    }
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'isActive', 'lastLoginAt', 'createdAt', 'updatedAt']
    });

    if (!user) {
      throw createNotFoundError('User');
    }

    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    updateData: Partial<Pick<User, 'firstName' | 'lastName'>>
  ): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw createNotFoundError('User');
    }

    // Update user data
    Object.assign(user, updateData);
    const updatedUser = await this.userRepository.save(user);

    // Return without password
    const { password: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  /**
   * Deactivate user account
   */
  async deactivateAccount(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw createNotFoundError('User');
    }

    user.isActive = false;
    await this.userRepository.save(user);
  }

  /**
   * Generate JWT access token
   */
  private generateAccessToken(user: User): string {
    const jwtSecret = process.env.JWT_SECRET;
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email
    };

    return jwt.sign(payload, jwtSecret, {
      expiresIn: jwtExpiresIn,
      issuer: 'task-management-api',
      audience: 'task-management-client'
    } as jwt.SignOptions);
  }

  /**
   * Generate JWT refresh token
   */
  private generateRefreshToken(user: User): string {
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
    const jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

    if (!jwtRefreshSecret) {
      throw new Error('JWT_REFRESH_SECRET is not configured');
    }

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email
    };

    return jwt.sign(payload, jwtRefreshSecret, {
      expiresIn: jwtRefreshExpiresIn,
      issuer: 'task-management-api',
      audience: 'task-management-client'
    } as jwt.SignOptions);
  }

  /**
   * Verify JWT token
   */
  async verifyToken(token: string): Promise<User> {
    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET is not configured');
      }

      const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
      
      const user = await this.userRepository.findOne({
        where: { id: decoded.userId },
        select: ['id', 'email', 'firstName', 'lastName', 'role', 'isActive', 'createdAt', 'updatedAt']
      });

      if (!user || !user.isActive) {
        throw createAuthenticationError('Invalid token');
      }

      return user;
    } catch (error) {
      throw createAuthenticationError('Invalid token');
    }
  }
}
