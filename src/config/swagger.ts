import { Options } from 'swagger-jsdoc';

export const swaggerOptions: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Task Management System API',
      version: '1.0.0',
      description: `
        A comprehensive Task Management System API built with Node.js, TypeScript, and PostgreSQL.
        
        ## Features
        - JWT-based authentication
        - User management
        - Task CRUD operations
        - Input validation
        - Error handling
        - Rate limiting
        
        ## Authentication
        Most endpoints require authentication. Include the JWT token in the Authorization header:
        \`Authorization: Bearer <your-jwt-token>\`
        
        ## Error Responses
        All endpoints return consistent error responses with the following structure:
        \`\`\`json
        {
          "success": false,
          "message": "Error description",
          "error": "ERROR_CODE",
          "details": "Additional error details (optional)"
        }
        \`\`\`
      `,
      contact: {
        name: 'API Support',
        email: 'support@taskmanagement.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}/api/${process.env.API_VERSION || 'v1'}`,
        description: 'Development server'
      },
      {
        url: `https://api.taskmanagement.com/api/${process.env.API_VERSION || 'v1'}`,
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from login endpoint'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique user identifier'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            firstName: {
              type: 'string',
              description: 'User first name'
            },
            lastName: {
              type: 'string',
              description: 'User last name'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'User creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'User last update timestamp'
            }
          }
        },
        Task: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique task identifier'
            },
            title: {
              type: 'string',
              description: 'Task title'
            },
            description: {
              type: 'string',
              description: 'Task description'
            },
            status: {
              type: 'string',
              enum: ['pending', 'in_progress', 'completed'],
              description: 'Task status'
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: 'Task priority'
            },
            dueDate: {
              type: 'string',
              format: 'date-time',
              description: 'Task due date'
            },
            completedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Task completion timestamp'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Task creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Task last update timestamp'
            },
            userId: {
              type: 'string',
              format: 'uuid',
              description: 'ID of the user who owns this task'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              description: 'Error message'
            },
            error: {
              type: 'string',
              description: 'Error code'
            },
            details: {
              type: 'string',
              description: 'Additional error details'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
    './src/models/*.ts'
  ]
};
