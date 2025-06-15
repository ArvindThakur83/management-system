import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Task } from '../models/Task';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'task_management_db',
  synchronize: process.env.NODE_ENV === 'development', // Only in development
  logging: process.env.NODE_ENV === 'development',
  entities: [User, Task],
  migrations: ['dist/migrations/*.js'],
  subscribers: ['dist/subscribers/*.js'],
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  extra: {
    connectionLimit: 10,
    acquireTimeout: 30000,
    timeout: 30000,
  },
  connectTimeoutMS: 10000,
});

// Database connection helper functions
export const connectDatabase = async (): Promise<void> => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ Database connected successfully');
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('✅ Database disconnected successfully');
    }
  } catch (error) {
    console.error('❌ Database disconnection failed:', error);
    throw error;
  }
};

// Health check for database
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    if (!AppDataSource.isInitialized) {
      return false;
    }
    
    await AppDataSource.query('SELECT 1');
    return true;
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    return false;
  }
};
