import 'reflect-metadata';
import { AppDataSource } from '../src/config/database';

// Setup test environment
beforeAll(async () => {
  // Initialize test database connection
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
});

afterAll(async () => {
  // Close database connection after tests
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
});

// Global test timeout
jest.setTimeout(30000);
