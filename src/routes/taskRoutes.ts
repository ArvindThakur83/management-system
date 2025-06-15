import { Router } from 'express';
import { TaskController } from '../controllers/TaskController';
import { authenticate } from '../middleware/auth';
import { validate, taskSchemas, paramSchemas } from '../middleware/validation';

const router = Router();
const taskController = new TaskController();

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Task management endpoints
 */

// Apply authentication to all task routes
router.use(authenticate);

/**
 * POST /tasks
 * Create a new task
 */
router.post(
  '/',
  validate(taskSchemas.create),
  taskController.createTask
);

/**
 * GET /tasks
 * Get list of tasks with optional filters
 */
router.get(
  '/',
  validate(taskSchemas.filters, 'query'),
  taskController.getTasks
);

/**
 * GET /tasks/:id
 * Get a single task by ID
 */
router.get(
  '/:id',
  validate(paramSchemas.taskId, 'params'),
  taskController.getTaskById
);

/**
 * PUT /tasks/:id
 * Update task details
 */
router.put(
  '/:id',
  validate(paramSchemas.taskId, 'params'),
  validate(taskSchemas.update),
  taskController.updateTask
);

/**
 * PATCH /tasks/:id/complete
 * Mark a task as complete
 */
router.patch(
  '/:id/complete',
  validate(paramSchemas.taskId, 'params'),
  taskController.completeTask
);

/**
 * DELETE /tasks/:id
 * Delete a task
 */
router.delete(
  '/:id',
  validate(paramSchemas.taskId, 'params'),
  taskController.deleteTask
);

export default router;
