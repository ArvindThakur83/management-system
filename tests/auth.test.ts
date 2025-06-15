import request from 'supertest';
import { AppDataSource } from '../src/config/database';
import { User } from '../src/models/User';
import app from '../src/app';

describe('Authentication Endpoints', () => {
  let userRepository: any;

  beforeAll(async () => {
    userRepository = AppDataSource.getRepository(User);
  });

  beforeEach(async () => {
    // Clean up users before each test
    await userRepository.clear();
  });

  describe('POST /api/v1/auth/signup', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPass123!',
        firstName: 'John',
        lastName: 'Doe'
      };

      const response = await request(app.app)
        .post('/api/v1/auth/signup')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should return validation error for invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'TestPass123!',
        firstName: 'John',
        lastName: 'Doe'
      };

      const response = await request(app.app)
        .post('/api/v1/auth/signup')
        .send(userData)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('VALIDATION_ERROR');
    });

    it('should return error for duplicate email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPass123!',
        firstName: 'John',
        lastName: 'Doe'
      };

      // Create first user
      await request(app.app)
        .post('/api/v1/auth/signup')
        .send(userData)
        .expect(201);

      // Try to create duplicate user
      const response = await request(app.app)
        .post('/api/v1/auth/signup')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('DUPLICATE_RESOURCE');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      const userData = {
        email: 'test@example.com',
        password: 'TestPass123!',
        firstName: 'John',
        lastName: 'Doe'
      };

      await request(app.app)
        .post('/api/v1/auth/signup')
        .send(userData);
    });

    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'TestPass123!'
      };

      const response = await request(app.app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data.user.email).toBe(loginData.email);
      expect(response.body.data.token).toBeDefined();
    });

    it('should return error for invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'WrongPassword123!'
      };

      const response = await request(app.app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('AUTHENTICATION_ERROR');
    });

    it('should return error for non-existent user', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'TestPass123!'
      };

      const response = await request(app.app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('AUTHENTICATION_ERROR');
    });
  });
});
