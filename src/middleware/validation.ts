import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ApiError, HttpStatus, ErrorCodes, ValidationError } from '../types';

/**
 * Generic validation middleware factory
 */
export const validate = (schema: Joi.ObjectSchema, property: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      const validationErrors: ValidationError[] = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      const apiError: ApiError = {
        success: false,
        message: 'Validation failed',
        error: ErrorCodes.VALIDATION_ERROR,
        details: JSON.stringify(validationErrors)
      };

      res.status(HttpStatus.UNPROCESSABLE_ENTITY).json(apiError);
      return;
    }

    // Replace the original data with validated and sanitized data
    req[property] = value;
    next();
  };
};

// Common validation schemas
export const commonSchemas = {
  // UUID validation
  uuid: Joi.string().uuid({ version: 'uuidv4' }).required(),
  
  // Pagination
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
  }),

  // Sorting
  sorting: Joi.object({
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'title', 'dueDate').default('createdAt'),
    sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC')
  }),

  // Date range
  dateRange: Joi.object({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref('startDate'))
  })
};

// Authentication validation schemas
export const authSchemas = {
  signup: Joi.object({
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .lowercase()
      .trim()
      .max(255)
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'string.empty': 'Email is required',
        'string.max': 'Email must not exceed 255 characters'
      }),
    
    password: Joi.string()
      .min(8)
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.max': 'Password must not exceed 128 characters',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'string.empty': 'Password is required'
      }),
    
    firstName: Joi.string()
      .trim()
      .min(1)
      .max(100)
      .pattern(/^[a-zA-Z\s'-]+$/)
      .required()
      .messages({
        'string.min': 'First name is required',
        'string.max': 'First name must not exceed 100 characters',
        'string.pattern.base': 'First name can only contain letters, spaces, hyphens, and apostrophes',
        'string.empty': 'First name is required'
      }),
    
    lastName: Joi.string()
      .trim()
      .min(1)
      .max(100)
      .pattern(/^[a-zA-Z\s'-]+$/)
      .required()
      .messages({
        'string.min': 'Last name is required',
        'string.max': 'Last name must not exceed 100 characters',
        'string.pattern.base': 'Last name can only contain letters, spaces, hyphens, and apostrophes',
        'string.empty': 'Last name is required'
      })
  }),

  login: Joi.object({
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .lowercase()
      .trim()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'string.empty': 'Email is required'
      }),
    
    password: Joi.string()
      .required()
      .messages({
        'string.empty': 'Password is required'
      })
  })
};

// Task validation schemas
export const taskSchemas = {
  create: Joi.object({
    title: Joi.string()
      .trim()
      .min(1)
      .max(255)
      .required()
      .messages({
        'string.min': 'Task title is required',
        'string.max': 'Task title must not exceed 255 characters',
        'string.empty': 'Task title is required'
      }),
    
    description: Joi.string()
      .trim()
      .max(2000)
      .allow('')
      .optional()
      .messages({
        'string.max': 'Task description must not exceed 2000 characters'
      }),
    
    status: Joi.string()
      .valid('pending', 'in_progress', 'completed')
      .default('pending')
      .messages({
        'any.only': 'Status must be one of: pending, in_progress, completed'
      }),
    
    priority: Joi.string()
      .valid('low', 'medium', 'high')
      .default('medium')
      .messages({
        'any.only': 'Priority must be one of: low, medium, high'
      }),
    
    dueDate: Joi.date()
      .iso()
      .min('now')
      .optional()
      .messages({
        'date.min': 'Due date cannot be in the past',
        'date.format': 'Due date must be a valid ISO date'
      })
  }),

  update: Joi.object({
    title: Joi.string()
      .trim()
      .min(1)
      .max(255)
      .optional()
      .messages({
        'string.min': 'Task title cannot be empty',
        'string.max': 'Task title must not exceed 255 characters'
      }),
    
    description: Joi.string()
      .trim()
      .max(2000)
      .allow('')
      .optional()
      .messages({
        'string.max': 'Task description must not exceed 2000 characters'
      }),
    
    status: Joi.string()
      .valid('pending', 'in_progress', 'completed')
      .optional()
      .messages({
        'any.only': 'Status must be one of: pending, in_progress, completed'
      }),
    
    priority: Joi.string()
      .valid('low', 'medium', 'high')
      .optional()
      .messages({
        'any.only': 'Priority must be one of: low, medium, high'
      }),
    
    dueDate: Joi.date()
      .iso()
      .optional()
      .allow(null)
      .messages({
        'date.format': 'Due date must be a valid ISO date'
      })
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update'
  }),

  filters: Joi.object({
    status: Joi.string()
      .valid('pending', 'in_progress', 'completed')
      .optional(),
    
    priority: Joi.string()
      .valid('low', 'medium', 'high')
      .optional(),
    
    dueDateFrom: Joi.date()
      .iso()
      .optional(),
    
    dueDateTo: Joi.date()
      .iso()
      .min(Joi.ref('dueDateFrom'))
      .optional(),
    
    search: Joi.string()
      .trim()
      .max(255)
      .optional(),
    
    page: Joi.number()
      .integer()
      .min(1)
      .default(1),
    
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(10),
    
    sortBy: Joi.string()
      .valid('createdAt', 'updatedAt', 'dueDate', 'title', 'priority', 'status')
      .default('createdAt'),
    
    sortOrder: Joi.string()
      .valid('ASC', 'DESC')
      .default('DESC')
  })
};

// Parameter validation schemas
export const paramSchemas = {
  taskId: Joi.object({
    id: commonSchemas.uuid
  })
};
