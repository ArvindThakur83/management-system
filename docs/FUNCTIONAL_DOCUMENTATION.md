# Task Management System - Functional Documentation

## 📋 Project Overview

The Task Management System is a comprehensive RESTful API designed to help users manage their tasks efficiently. Built with modern technologies and best practices, it provides a robust backend solution for task management applications.

### Key Objectives
- Provide secure user authentication and authorization
- Enable comprehensive task management operations
- Ensure data integrity and security
- Offer scalable and maintainable architecture
- Deliver excellent developer experience with comprehensive documentation

## 🛠️ Tech Stack & Tools Used

### Core Technologies
- **Node.js 18+**: JavaScript runtime for server-side development
- **TypeScript**: Type-safe JavaScript for better development experience
- **Express.js**: Fast, unopinionated web framework for Node.js
- **PostgreSQL 15**: Robust relational database for data persistence
- **TypeORM**: Object-Relational Mapping for database operations

### Authentication & Security
- **JWT (JSON Web Tokens)**: Stateless authentication mechanism
- **bcryptjs**: Password hashing and verification
- **Helmet.js**: Security middleware for Express applications
- **CORS**: Cross-Origin Resource Sharing configuration

### Validation & Documentation
- **Joi**: Schema validation for request data
- **Swagger/OpenAPI 3.0**: API documentation and testing interface
- **class-validator**: Decorator-based validation for TypeScript classes

### Development & Deployment
- **Docker & Docker Compose**: Containerization and orchestration
- **GitHub Actions**: CI/CD pipeline for automated testing and deployment
- **ESLint**: Code linting and style enforcement
- **Jest**: Testing framework for unit and integration tests

## 🔐 Authentication Flow Explanation

### JWT-Based Authentication Architecture

The system implements a stateless authentication mechanism using JSON Web Tokens (JWT) with the following components:

#### 1. User Registration Flow
```
Client → POST /auth/signup → Validation → Password Hashing → Database Storage → JWT Generation → Response
```

**Process:**
1. Client sends registration data (email, password, firstName, lastName)
2. Server validates input using Joi schemas
3. System checks for existing user with the same email
4. Password is hashed using bcrypt with 12 salt rounds
5. User record is created in the database
6. JWT access token and refresh token are generated
7. User data (without password) and tokens are returned

#### 2. User Login Flow
```
Client → POST /auth/login → Validation → User Lookup → Password Verification → JWT Generation → Response
```

**Process:**
1. Client sends login credentials (email, password)
2. Server validates input format
3. User is retrieved from database by email
4. Password is verified against stored hash
5. User account status is checked (active/inactive)
6. JWT tokens are generated and returned
7. Last login timestamp is updated

#### 3. Token Refresh Flow
```
Client → POST /auth/refresh → Token Validation → User Verification → New Token Generation → Response
```

**Process:**
1. Client sends refresh token
2. Server validates refresh token signature and expiration
3. User is verified to still exist and be active
4. New access token and refresh token are generated
5. New tokens are returned to client

#### 4. Protected Route Access
```
Client → Request with Bearer Token → Token Validation → User Lookup → Route Handler → Response
```

**Process:**
1. Client includes JWT token in Authorization header
2. Authentication middleware extracts and validates token
3. User information is retrieved and attached to request
4. Route handler processes the authenticated request

### Token Configuration
- **Access Token**: Short-lived (7 days default), used for API access
- **Refresh Token**: Long-lived (30 days default), used to obtain new access tokens
- **Security**: Tokens are signed with secret keys and include user identification

## 📋 Task Lifecycle

### Task States and Transitions

#### Task Status Flow
```
PENDING → IN_PROGRESS → COMPLETED
    ↑         ↓             ↑
    ←---------←-------------←
```

**Status Definitions:**
- **PENDING**: Task is created but not yet started
- **IN_PROGRESS**: Task is actively being worked on
- **COMPLETED**: Task has been finished

#### Task Priority Levels
- **LOW**: Non-urgent tasks that can be done when time permits
- **MEDIUM**: Standard priority tasks (default)
- **HIGH**: Urgent tasks requiring immediate attention

### Task Operations

#### 1. Task Creation
```
User → POST /tasks → Validation → Database Insert → Response
```

**Features:**
- Required: title
- Optional: description, status, priority, dueDate
- Automatic: userId assignment, timestamps
- Validation: Title length, due date format, enum values

#### 2. Task Retrieval
```
User → GET /tasks → Query Building → Database Query → Pagination → Response
```

**Filtering Options:**
- Status filtering (pending, in_progress, completed)
- Priority filtering (low, medium, high)
- Date range filtering (dueDateFrom, dueDateTo)
- Text search (title and description)
- Sorting (createdAt, updatedAt, dueDate, title)
- Pagination (page, limit)

#### 3. Task Updates
```
User → PUT /tasks/:id → Validation → Ownership Check → Database Update → Response
```

**Update Features:**
- Partial updates supported
- Status change triggers automatic timestamp updates
- Completion status automatically sets completedAt timestamp
- Validation ensures data integrity

#### 4. Task Completion
```
User → PATCH /tasks/:id/complete → Ownership Check → Status Update → Timestamp Update → Response
```

**Completion Logic:**
- Sets status to COMPLETED
- Records completion timestamp
- Prevents duplicate completion

#### 5. Task Deletion
```
User → DELETE /tasks/:id → Ownership Check → Database Deletion → Response
```

**Deletion Features:**
- Soft delete option available (can be configured)
- Ownership verification prevents unauthorized deletion
- Cascade deletion with user account deletion

## 🗂️ Route Grouping Explanation

### API Structure and Organization

#### Base URL Structure
```
/api/v1/{resource}/{action}
```

#### Route Groups

##### 1. Authentication Routes (`/auth`)
**Purpose**: Handle user authentication and authorization
**Security**: Rate-limited to prevent brute force attacks
**Routes:**
- `POST /auth/signup` - User registration
- `POST /auth/login` - User authentication
- `POST /auth/refresh` - Token refresh
- `POST /auth/logout` - User logout

**Rate Limiting**: 5 requests per 15 minutes per IP

##### 2. User Routes (`/users`)
**Purpose**: User profile management
**Security**: Requires authentication for all routes
**Routes:**
- `GET /users/me` - Get current user profile
- `PUT /users/me` - Update user profile
- `DELETE /users/me` - Deactivate user account

**Access Control**: Users can only access their own profile data

##### 3. Task Routes (`/tasks`)
**Purpose**: Task management operations
**Security**: Requires authentication, ownership-based access control
**Routes:**
- `POST /tasks` - Create new task
- `GET /tasks` - List tasks with filtering
- `GET /tasks/:id` - Get specific task
- `PUT /tasks/:id` - Update task
- `PATCH /tasks/:id/complete` - Mark task complete
- `DELETE /tasks/:id` - Delete task

**Access Control**: Users can only access their own tasks

#### Middleware Stack

##### Global Middleware (Applied to all routes)
1. **Helmet**: Security headers
2. **CORS**: Cross-origin resource sharing
3. **Morgan**: Request logging
4. **Express.json**: JSON body parsing
5. **Rate Limiter**: Basic rate limiting

##### Route-Specific Middleware
1. **Authentication**: JWT token validation
2. **Validation**: Request data validation using Joi
3. **Authorization**: Role-based access control
4. **Ownership**: Resource ownership verification

## 🔍 Assumptions & Limitations

### Assumptions Made

#### User Management
- Each user has a unique email address
- Users are responsible for password security
- Account deactivation is preferred over deletion for data integrity
- Users can only access their own resources

#### Task Management
- Tasks belong to a single user (no collaboration features)
- Task titles are required, descriptions are optional
- Due dates are optional and can be in the future
- Task priorities are predefined (low, medium, high)

#### Technical Assumptions
- PostgreSQL is available and properly configured
- JWT secrets are securely managed
- HTTPS is used in production environments
- Client applications handle token storage securely

### Current Limitations

#### Functional Limitations
1. **No Multi-user Collaboration**: Tasks cannot be shared between users
2. **No File Attachments**: Tasks support only text-based content
3. **No Notifications**: No email or push notification system
4. **No Task Categories/Tags**: Limited organization options
5. **No Recurring Tasks**: No support for repeating tasks
6. **No Time Tracking**: No built-in time logging functionality

#### Technical Limitations
1. **No Real-time Updates**: No WebSocket support for live updates
2. **Basic Caching**: No advanced caching strategies implemented
3. **Single Database**: No database sharding or replication
4. **No Audit Trail**: Limited activity logging
5. **Basic Search**: No full-text search capabilities
6. **No Bulk Operations**: Limited batch processing support

#### Security Limitations
1. **No OAuth Integration**: Only email/password authentication
2. **No Two-Factor Authentication**: Single-factor authentication only
3. **No Session Management**: Stateless JWT without revocation
4. **Basic Rate Limiting**: Simple IP-based rate limiting

### Future Enhancement Opportunities

#### Short-term Improvements
- Add task categories and tags
- Implement file attachment support
- Add email notifications
- Enhance search capabilities
- Add bulk operations

#### Long-term Enhancements
- Multi-user collaboration features
- Real-time updates with WebSockets
- Advanced analytics and reporting
- Mobile application support
- Integration with external calendar systems
- Advanced security features (2FA, OAuth)

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18 or higher
- PostgreSQL 15 or higher
- Docker and Docker Compose (optional)
- Git for version control

### Development Setup

#### 1. Clone and Install
```bash
git clone <repository-url>
cd task-management-system
npm install
```

#### 2. Database Setup
```bash
# Create PostgreSQL database
createdb task_management_db

# Or using Docker
docker run --name postgres-db -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15
```

#### 3. Environment Configuration
```bash
cp .env.example .env
# Edit .env with your configuration
```

#### 4. Start Development Server
```bash
npm run dev
```

### Production Deployment

#### Using Docker Compose
```bash
docker-compose -f docker-compose.prod.yml up -d
```

#### Manual Deployment
```bash
npm run build
npm start
```

### Testing
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage
```

### API Documentation
Access interactive documentation at: `http://localhost:3000/api-docs`

This comprehensive system provides a solid foundation for task management applications with room for future enhancements and scalability.
