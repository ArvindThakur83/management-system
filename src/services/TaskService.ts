import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Task } from '../models/Task';
import { User } from '../models/User';
import {
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskFilters,
  TaskStatus,
  TaskPriority,
  ApiResponse
} from '../types';
import {
  AppError,
  createNotFoundError
} from '../middleware/errorHandler';

export class TaskService {
  private taskRepository: Repository<Task>;
  private userRepository: Repository<User>;

  constructor() {
    this.taskRepository = AppDataSource.getRepository(Task);
    this.userRepository = AppDataSource.getRepository(User);
  }

  /**
   * Create a new task
   */
  async createTask(userId: string, taskData: CreateTaskRequest): Promise<Task> {
    // Verify user exists
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw createNotFoundError('User');
    }

    // Create task
    const task = this.taskRepository.create({
      ...taskData,
      userId,
      status: taskData.status || TaskStatus.PENDING,
      priority: taskData.priority || TaskPriority.MEDIUM
    });

    return await this.taskRepository.save(task);
  }

  /**
   * Get tasks with filters and pagination
   */
  async getTasks(userId: string, filters: TaskFilters): Promise<ApiResponse<Task[]>> {
    const {
      status,
      priority,
      dueDateFrom,
      dueDateTo,
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = filters;

    // Build query
    let query = this.taskRepository
      .createQueryBuilder('task')
      .where('task.userId = :userId', { userId });

    // Apply filters
    if (status) {
      query = query.andWhere('task.status = :status', { status });
    }

    if (priority) {
      query = query.andWhere('task.priority = :priority', { priority });
    }

    if (dueDateFrom) {
      query = query.andWhere('task.dueDate >= :dueDateFrom', { dueDateFrom });
    }

    if (dueDateTo) {
      query = query.andWhere('task.dueDate <= :dueDateTo', { dueDateTo });
    }

    if (search) {
      query = query.andWhere(
        '(task.title ILIKE :search OR task.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Apply sorting
    const sortField = this.getSortField(sortBy);
    query = query.orderBy(sortField, sortOrder);

    // Apply pagination
    const skip = (page - 1) * limit;
    query = query.skip(skip).take(limit);

    // Execute query
    const [tasks, total] = await query.getManyAndCount();

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      message: 'Tasks retrieved successfully',
      data: tasks,
      meta: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }

  /**
   * Get a single task by ID
   */
  async getTaskById(userId: string, taskId: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId, userId }
    });

    if (!task) {
      throw createNotFoundError('Task');
    }

    return task;
  }

  /**
   * Update a task
   */
  async updateTask(
    userId: string, 
    taskId: string, 
    updateData: UpdateTaskRequest
  ): Promise<Task> {
    const task = await this.getTaskById(userId, taskId);

    // Update task properties
    Object.assign(task, updateData);

    // Handle status change logic
    if (updateData.status) {
      if (updateData.status === TaskStatus.COMPLETED) {
        task.markAsCompleted();
      } else if (updateData.status === TaskStatus.IN_PROGRESS) {
        task.markAsInProgress();
      } else if (updateData.status === TaskStatus.PENDING) {
        task.markAsPending();
      }
    }

    return await this.taskRepository.save(task);
  }

  /**
   * Mark task as complete
   */
  async completeTask(userId: string, taskId: string): Promise<Task> {
    const task = await this.getTaskById(userId, taskId);

    if (task.status === TaskStatus.COMPLETED) {
      throw new AppError('Task is already completed', 400);
    }

    task.markAsCompleted();
    return await this.taskRepository.save(task);
  }

  /**
   * Delete a task
   */
  async deleteTask(userId: string, taskId: string): Promise<void> {
    const task = await this.getTaskById(userId, taskId);
    await this.taskRepository.remove(task);
  }

  /**
   * Get task statistics for a user
   */
  async getTaskStatistics(userId: string): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
    highPriority: number;
  }> {
    const query = this.taskRepository
      .createQueryBuilder('task')
      .where('task.userId = :userId', { userId });

    const [
      total,
      pending,
      inProgress,
      completed,
      overdue,
      highPriority
    ] = await Promise.all([
      query.getCount(),
      query.clone().andWhere('task.status = :status', { status: TaskStatus.PENDING }).getCount(),
      query.clone().andWhere('task.status = :status', { status: TaskStatus.IN_PROGRESS }).getCount(),
      query.clone().andWhere('task.status = :status', { status: TaskStatus.COMPLETED }).getCount(),
      query.clone()
        .andWhere('task.dueDate < :now', { now: new Date() })
        .andWhere('task.status != :status', { status: TaskStatus.COMPLETED })
        .getCount(),
      query.clone().andWhere('task.priority = :priority', { priority: TaskPriority.HIGH }).getCount()
    ]);

    return {
      total,
      pending,
      inProgress,
      completed,
      overdue,
      highPriority
    };
  }

  /**
   * Get upcoming tasks (due within next 7 days)
   */
  async getUpcomingTasks(userId: string, days: number = 7): Promise<Task[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);

    return await this.taskRepository
      .createQueryBuilder('task')
      .where('task.userId = :userId', { userId })
      .andWhere('task.dueDate BETWEEN :now AND :futureDate', { now, futureDate })
      .andWhere('task.status != :status', { status: TaskStatus.COMPLETED })
      .orderBy('task.dueDate', 'ASC')
      .getMany();
  }

  /**
   * Get overdue tasks
   */
  async getOverdueTasks(userId: string): Promise<Task[]> {
    const now = new Date();

    return await this.taskRepository
      .createQueryBuilder('task')
      .where('task.userId = :userId', { userId })
      .andWhere('task.dueDate < :now', { now })
      .andWhere('task.status != :status', { status: TaskStatus.COMPLETED })
      .orderBy('task.dueDate', 'ASC')
      .getMany();
  }

  /**
   * Bulk update task status
   */
  async bulkUpdateStatus(
    userId: string, 
    taskIds: string[], 
    status: TaskStatus
  ): Promise<{ updated: number; failed: string[] }> {
    const failed: string[] = [];
    let updated = 0;

    for (const taskId of taskIds) {
      try {
        await this.updateTask(userId, taskId, { status });
        updated++;
      } catch (error) {
        failed.push(taskId);
      }
    }

    return { updated, failed };
  }

  /**
   * Bulk delete tasks
   */
  async bulkDeleteTasks(userId: string, taskIds: string[]): Promise<{ deleted: number; failed: string[] }> {
    const failed: string[] = [];
    let deleted = 0;

    for (const taskId of taskIds) {
      try {
        await this.deleteTask(userId, taskId);
        deleted++;
      } catch (error) {
        failed.push(taskId);
      }
    }

    return { deleted, failed };
  }

  /**
   * Helper method to get sort field for query
   */
  private getSortField(sortBy: string): string {
    const sortFields: { [key: string]: string } = {
      'createdAt': 'task.createdAt',
      'updatedAt': 'task.updatedAt',
      'dueDate': 'task.dueDate',
      'title': 'task.title',
      'priority': 'task.priority',
      'status': 'task.status'
    };

    return sortFields[sortBy] || 'task.createdAt';
  }
}
