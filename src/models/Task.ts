import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeUpdate
} from 'typeorm';
import { IsNotEmpty, MaxLength, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { User } from './User';
import { TaskStatus, TaskPriority } from '../types';

/**
 * @swagger
 * components:
 *   schemas:
 *     Task:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique task identifier
 *         title:
 *           type: string
 *           description: Task title
 *         description:
 *           type: string
 *           description: Task description
 *         status:
 *           type: string
 *           enum: [pending, in_progress, completed]
 *           description: Task status
 *         priority:
 *           type: string
 *           enum: [low, medium, high]
 *           description: Task priority
 *         dueDate:
 *           type: string
 *           format: date-time
 *           description: Task due date
 *         completedAt:
 *           type: string
 *           format: date-time
 *           description: Task completion timestamp
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Task creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Task last update timestamp
 *         userId:
 *           type: string
 *           format: uuid
 *           description: ID of the user who owns this task
 */
@Entity('tasks')
@Index(['userId', 'status'])
@Index(['userId', 'dueDate'])
@Index(['userId', 'createdAt'])
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  @IsNotEmpty({ message: 'Task title is required' })
  @MaxLength(255, { message: 'Task title must not exceed 255 characters' })
  title: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @MaxLength(2000, { message: 'Task description must not exceed 2000 characters' })
  description: string | null;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.PENDING
  })
  @IsEnum(TaskStatus, { message: 'Invalid task status' })
  status: TaskStatus;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM
  })
  @IsEnum(TaskPriority, { message: 'Invalid task priority' })
  priority: TaskPriority;

  @Column({ name: 'due_date', type: 'timestamp', nullable: true })
  @IsOptional()
  @IsDateString({}, { message: 'Due date must be a valid date' })
  dueDate: Date | null;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Foreign key
  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId: string;

  // Relationships
  @ManyToOne(() => User, user => user.tasks, {
    onDelete: 'CASCADE',
    eager: false
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Hooks
  @BeforeUpdate()
  updateCompletedAt(): void {
    if (this.status === TaskStatus.COMPLETED && !this.completedAt) {
      this.completedAt = new Date();
    } else if (this.status !== TaskStatus.COMPLETED && this.completedAt) {
      this.completedAt = null;
    }
  }

  // Instance methods
  markAsCompleted(): void {
    this.status = TaskStatus.COMPLETED;
    this.completedAt = new Date();
  }

  markAsInProgress(): void {
    this.status = TaskStatus.IN_PROGRESS;
    this.completedAt = null;
  }

  markAsPending(): void {
    this.status = TaskStatus.PENDING;
    this.completedAt = null;
  }

  isOverdue(): boolean {
    if (!this.dueDate || this.status === TaskStatus.COMPLETED) {
      return false;
    }
    return new Date() > this.dueDate;
  }

  getDaysUntilDue(): number | null {
    if (!this.dueDate) {
      return null;
    }
    const now = new Date();
    const diffTime = this.dueDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Computed properties
  get isCompleted(): boolean {
    return this.status === TaskStatus.COMPLETED;
  }

  get isPending(): boolean {
    return this.status === TaskStatus.PENDING;
  }

  get isInProgress(): boolean {
    return this.status === TaskStatus.IN_PROGRESS;
  }

  get isHighPriority(): boolean {
    return this.priority === TaskPriority.HIGH;
  }

  // Static methods
  static getStatusOptions(): TaskStatus[] {
    return Object.values(TaskStatus);
  }

  static getPriorityOptions(): TaskPriority[] {
    return Object.values(TaskPriority);
  }

  // Convert to plain object
  toJSON(): any {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      status: this.status,
      priority: this.priority,
      dueDate: this.dueDate,
      completedAt: this.completedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      userId: this.userId,
      isOverdue: this.isOverdue(),
      daysUntilDue: this.getDaysUntilDue()
    };
  }
}
