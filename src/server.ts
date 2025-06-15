import 'reflect-metadata';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

// Import the app after environment variables are loaded
import app from './app';

// Start the server
async function startServer() {
  try {
    console.log('🚀 Starting Task Management API...');
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    await app.listen();
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();
