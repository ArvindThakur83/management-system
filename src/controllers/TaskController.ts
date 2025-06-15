import { Response, NextFunction } from 'express';
import { TaskService } from '../services/TaskService';
import { AuthenticatedRequest, ApiResponse, HttpStatus } from '../types';
import { asyncHandler } from '../middleware/errorHandler';

export class TaskController {
  private taskService: TaskService;

  constructor() {
    this.taskService = new TaskService();
  }

  /**
   * @swagger
   * /tasks:
   *   post:
   *     summary: Create a new task
   *     tags: [Tasks]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - title
   *             properties:
   *               title:
   *                 type: string
   *                 example: Complete project documentation
   *               description:
   *                 type: string
   *                 example: Write comprehensive documentation for the API
   *               status:
   *                 type: string
   *                 enum: [pending, in_progress, completed]
   *                 default: pending
   *               priority:
   *                 type: string
   *                 enum: [low, medium, high]
   *                 default: medium
   *               dueDate:
   *                 type: string
   *                 format: date-time
   *                 example: 2024-12-31T23:59:59.000Z
   *     responses:
   *       201:
   *         description: Task created successfully
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
   *                   example: Task created successfully
   *                 data:
   *                   $ref: '#/components/schemas/Task'
   */
  createTask = asyncHandler(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const task = await this.taskService.createTask(req.user.id, req.body);

    const response: ApiResponse = {
      success: true,
      message: 'Task created successfully',
      data: task
    };

    res.status(HttpStatus.CREATED).json(response);
  });

  /**
   * @swagger
   * /tasks:
   *   get:
   *     summary: Get list of tasks with optional filters
   *     tags: [Tasks]
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [pending, in_progress, completed]
   *         description: Filter by task status
   *       - in: query
   *         name: priority
   *         schema:
   *           type: string
   *           enum: [low, medium, high]
   *         description: Filter by task priority
   *       - in: query
   *         name: dueDateFrom
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Filter tasks due from this date
   *       - in: query
   *         name: dueDateTo
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Filter tasks due until this date
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search in task title and description
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Page number for pagination
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 10
   *         description: Number of tasks per page
   *       - in: query
   *         name: sortBy
   *         schema:
   *           type: string
   *           enum: [createdAt, updatedAt, dueDate, title, priority, status]
   *           default: createdAt
   *         description: Field to sort by
   *       - in: query
   *         name: sortOrder
   *         schema:
   *           type: string
   *           enum: [ASC, DESC]
   *           default: DESC
   *         description: Sort order
   *     responses:
   *       200:
   *         description: Tasks retrieved successfully
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
   *                   example: Tasks retrieved successfully
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Task'
   *                 meta:
   *                   type: object
   *                   properties:
   *                     page:
   *                       type: integer
   *                       example: 1
   *                     limit:
   *                       type: integer
   *                       example: 10
   *                     total:
   *                       type: integer
   *                       example: 25
   *                     totalPages:
   *                       type: integer
   *                       example: 3
   */
  getTasks = asyncHandler(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const result = await this.taskService.getTasks(req.user.id, req.query as any);
    res.status(HttpStatus.OK).json(result);
  });

  /**
   * @swagger
   * /tasks/{id}:
   *   get:
   *     summary: Get a single task by ID
   *     tags: [Tasks]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Task ID
   *     responses:
   *       200:
   *         description: Task retrieved successfully
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
   *                   example: Task retrieved successfully
   *                 data:
   *                   $ref: '#/components/schemas/Task'
   *       404:
   *         description: Task not found
   */
  getTaskById = asyncHandler(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const task = await this.taskService.getTaskById(req.user.id, req.params.id!);

    const response: ApiResponse = {
      success: true,
      message: 'Task retrieved successfully',
      data: task
    };

    res.status(HttpStatus.OK).json(response);
  });

  /**
   * @swagger
   * /tasks/{id}:
   *   put:
   *     summary: Update task details
   *     tags: [Tasks]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Task ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               title:
   *                 type: string
   *               description:
   *                 type: string
   *               status:
   *                 type: string
   *                 enum: [pending, in_progress, completed]
   *               priority:
   *                 type: string
   *                 enum: [low, medium, high]
   *               dueDate:
   *                 type: string
   *                 format: date-time
   *     responses:
   *       200:
   *         description: Task updated successfully
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
   *                   example: Task updated successfully
   *                 data:
   *                   $ref: '#/components/schemas/Task'
   */
  updateTask = asyncHandler(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const task = await this.taskService.updateTask(req.user.id, req.params.id!, req.body);

    const response: ApiResponse = {
      success: true,
      message: 'Task updated successfully',
      data: task
    };

    res.status(HttpStatus.OK).json(response);
  });

  /**
   * @swagger
   * /tasks/{id}/complete:
   *   patch:
   *     summary: Mark a task as complete
   *     tags: [Tasks]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Task ID
   *     responses:
   *       200:
   *         description: Task marked as complete
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
   *                   example: Task marked as complete
   *                 data:
   *                   $ref: '#/components/schemas/Task'
   */
  completeTask = asyncHandler(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const task = await this.taskService.completeTask(req.user.id, req.params.id!);

    const response: ApiResponse = {
      success: true,
      message: 'Task marked as complete',
      data: task
    };

    res.status(HttpStatus.OK).json(response);
  });

  /**
   * @swagger
   * /tasks/{id}:
   *   delete:
   *     summary: Delete a task
   *     tags: [Tasks]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Task ID
   *     responses:
   *       200:
   *         description: Task deleted successfully
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
   *                   example: Task deleted successfully
   */
  deleteTask = asyncHandler(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    await this.taskService.deleteTask(req.user.id, req.params.id!);

    const response: ApiResponse = {
      success: true,
      message: 'Task deleted successfully'
    };

    res.status(HttpStatus.OK).json(response);
  });
}
