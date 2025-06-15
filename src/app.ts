import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import { AppDataSource } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { rateLimiter } from './middleware/rateLimiter';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import taskRoutes from './routes/taskRoutes';
import { swaggerOptions } from './config/swagger';

// Load environment variables
dotenv.config();

class App {
  public app: express.Application;
  private port: string | number;

  constructor() {
    this.app = express();
    this.port = process.env['PORT'] || 3000;
    
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeSwagger();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(helmet());
    
    // CORS configuration
    this.app.use(cors({
      origin: process.env['CORS_ORIGIN']?.split(',') || ['http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // Rate limiting
    this.app.use(rateLimiter);

    // Logging
    if (process.env['NODE_ENV'] !== 'test') {
      this.app.use(morgan('combined'));
    }

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  }

  private initializeRoutes(): void {
    const apiVersion = process.env.API_VERSION || 'v1';
    
    // Health check endpoint
    this.app.get('/health', async (_req, res) => {
      const health = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        version: apiVersion,
        database: 'disconnected'
      };

      // Check database connection if available
      try {
        if (AppDataSource.isInitialized) {
          await AppDataSource.query('SELECT 1');
          health.database = 'connected';
        }
      } catch (error) {
        health.database = 'error';
      }

      res.status(200).json(health);
    });

    // API routes
    this.app.use(`/api/${apiVersion}/auth`, authRoutes);
    this.app.use(`/api/${apiVersion}/users`, userRoutes);
    this.app.use(`/api/${apiVersion}/tasks`, taskRoutes);
  }

  private initializeSwagger(): void {
    if (process.env.SWAGGER_ENABLED === 'true') {
      const specs = swaggerJsdoc(swaggerOptions);
      const swaggerPath = process.env.SWAGGER_PATH || '/api-docs';
      
      this.app.use(swaggerPath, swaggerUi.serve, swaggerUi.setup(specs, {
        explorer: true,
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'Task Management API Documentation'
      }));

      // Swagger JSON endpoint
      this.app.get(`${swaggerPath}.json`, (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(specs);
      });
    }
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);
    
    // Global error handler
    this.app.use(errorHandler);
  }

  public async listen(): Promise<void> {
    try {
      // Initialize database connection
      try {
        await AppDataSource.initialize();
        console.log('✅ Database connection established successfully');
      } catch (dbError) {
        console.warn('⚠️ Database connection failed, starting without database:', dbError);
        console.log('📝 Note: Database-dependent features will not work');
      }

      // Start server
      this.app.listen(this.port, () => {
        console.log(`🚀 Server running on port ${this.port}`);
        console.log(`📚 API Documentation: http://localhost:${this.port}${process.env.SWAGGER_PATH || '/api-docs'}`);
        console.log(`🏥 Health Check: http://localhost:${this.port}/health`);
      });
    } catch (error) {
      console.error('❌ Error starting server:', error);
      process.exit(1);
    }
  }
}

// Create the application instance
const app = new App();

// Start the application only if this file is run directly
if (require.main === module) {
  app.listen().catch(console.error);
}

export default app;
