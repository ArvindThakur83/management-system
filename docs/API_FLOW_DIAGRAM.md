# API Sequential Flow Diagram

## User Login → Create Task Flow

This document provides a visual representation of the complete flow from user authentication to task creation, including all system components and their interactions.

### Flow Overview

The diagram below illustrates the sequential flow of a user logging in and then creating a task, showing the interaction between:
- **Client**: Frontend application or API consumer
- **Route**: Express.js route handlers
- **Middleware**: Authentication, validation, and other middleware
- **Controller**: Business logic controllers
- **Service**: Service layer for business operations
- **Database**: PostgreSQL database operations

### Mermaid Diagram

```mermaid
sequenceDiagram
    participant C as Client
    participant R as Route Handler
    participant RM as Rate Limiter
    participant VM as Validation Middleware
    participant AC as Auth Controller
    participant AS as Auth Service
    participant DB as Database
    participant AM as Auth Middleware
    participant TC as Task Controller
    participant TS as Task Service

    Note over C,TS: User Login Flow
    
    C->>R: POST /api/v1/auth/login
    R->>RM: Check rate limits
    RM-->>R: Rate limit OK
    R->>VM: Validate request body
    VM-->>R: Validation passed
    R->>AC: login(email, password)
    
    AC->>AS: login(loginData)
    AS->>DB: findOne(user by email)
    DB-->>AS: User data with password
    
    alt User not found
        AS-->>AC: AuthenticationError
        AC-->>R: 401 Unauthorized
        R-->>C: Error response
    else User found
        AS->>AS: comparePassword()
        alt Password invalid
            AS-->>AC: AuthenticationError
            AC-->>R: 401 Unauthorized
            R-->>C: Error response
        else Password valid
            AS->>AS: generateAccessToken()
            AS->>AS: generateRefreshToken()
            AS->>DB: updateLastLogin()
            DB-->>AS: Update successful
            AS-->>AC: AuthResponse with tokens
            AC-->>R: Success response
            R-->>C: 200 OK with user data and tokens
        end
    end

    Note over C,TS: Task Creation Flow
    
    C->>R: POST /api/v1/tasks (with Bearer token)
    R->>RM: Check rate limits
    RM-->>R: Rate limit OK
    R->>AM: authenticate()
    
    AM->>AM: Extract JWT token
    alt No token provided
        AM-->>R: 401 Unauthorized
        R-->>C: Authentication error
    else Token provided
        AM->>AM: jwt.verify(token)
        alt Token invalid/expired
            AM-->>R: 401 Unauthorized
            R-->>C: Authentication error
        else Token valid
            AM->>DB: findOne(user by ID)
            DB-->>AM: User data
            alt User not found/inactive
                AM-->>R: 401 Unauthorized
                R-->>C: Authentication error
            else User valid
                AM->>AM: Attach user to request
                AM-->>R: Authentication successful
                
                R->>VM: Validate task data
                VM-->>R: Validation passed
                R->>TC: createTask(userId, taskData)
                
                TC->>TS: createTask(userId, taskData)
                TS->>DB: findOne(user exists)
                DB-->>TS: User confirmation
                
                alt User not found
                    TS-->>TC: NotFoundError
                    TC-->>R: 404 Not Found
                    R-->>C: Error response
                else User exists
                    TS->>TS: Create task entity
                    TS->>DB: save(task)
                    DB-->>TS: Saved task data
                    TS-->>TC: Task created
                    TC-->>R: 201 Created
                    R-->>C: Success with task data
                end
            end
        end
    end

    Note over C,TS: Error Handling Paths
    
    alt Rate limit exceeded
        RM-->>R: 429 Too Many Requests
        R-->>C: Rate limit error
    end
    
    alt Validation fails
        VM-->>R: 422 Unprocessable Entity
        R-->>C: Validation error
    end
    
    alt Database error
        DB-->>TS: Database error
        TS-->>TC: DatabaseError
        TC-->>R: 500 Internal Server Error
        R-->>C: Database error response
    end
```

### Flow Components Explanation

#### 1. Client Layer
- **Responsibility**: Initiates API requests
- **Authentication**: Stores and sends JWT tokens
- **Error Handling**: Processes API responses and errors

#### 2. Route Handler Layer
- **Responsibility**: HTTP request routing and response formatting
- **Middleware Integration**: Applies middleware in correct order
- **Response Management**: Formats and sends HTTP responses

#### 3. Middleware Layer

##### Rate Limiter Middleware
- **Purpose**: Prevents API abuse
- **Implementation**: IP-based request counting
- **Configuration**: Different limits for auth vs general endpoints

##### Validation Middleware
- **Purpose**: Validates request data structure and content
- **Implementation**: Joi schema validation
- **Error Response**: Detailed validation error messages

##### Authentication Middleware
- **Purpose**: Verifies user identity and authorization
- **Token Processing**: JWT extraction, verification, and user lookup
- **Request Enhancement**: Attaches user data to request object

#### 4. Controller Layer
- **Responsibility**: Orchestrates business logic
- **Error Handling**: Catches and formats service layer errors
- **Response Formatting**: Structures API responses consistently

#### 5. Service Layer
- **Responsibility**: Implements core business logic
- **Database Interaction**: Manages data persistence operations
- **Business Rules**: Enforces application-specific rules and validations

#### 6. Database Layer
- **Responsibility**: Data persistence and retrieval
- **Query Execution**: Handles SQL operations through TypeORM
- **Data Integrity**: Maintains referential integrity and constraints

### Error Handling Flows

#### Authentication Errors
1. **Missing Token**: 401 Unauthorized immediately
2. **Invalid Token**: JWT verification fails → 401 Unauthorized
3. **Expired Token**: JWT expiration check fails → 401 Unauthorized
4. **User Not Found**: Database lookup fails → 401 Unauthorized
5. **Inactive User**: User status check fails → 401 Unauthorized

#### Validation Errors
1. **Schema Validation**: Joi validation fails → 422 Unprocessable Entity
2. **Type Validation**: Data type mismatch → 422 Unprocessable Entity
3. **Business Rule Validation**: Service layer validation → 400 Bad Request

#### Database Errors
1. **Connection Error**: Database unavailable → 503 Service Unavailable
2. **Constraint Violation**: Unique constraint fails → 409 Conflict
3. **Query Error**: SQL execution fails → 500 Internal Server Error

#### Rate Limiting Errors
1. **General Rate Limit**: Too many requests → 429 Too Many Requests
2. **Auth Rate Limit**: Too many auth attempts → 429 Too Many Requests

### Performance Considerations

#### Database Optimization
- **Indexes**: Strategic indexing on frequently queried fields
- **Query Optimization**: Efficient query patterns using TypeORM
- **Connection Pooling**: Managed database connections

#### Caching Strategy
- **JWT Verification**: Token validation caching (future enhancement)
- **User Data**: User information caching (future enhancement)
- **Rate Limiting**: In-memory rate limit counters

#### Response Time Targets
- **Authentication**: < 200ms
- **Task Creation**: < 150ms
- **Task Retrieval**: < 100ms

### Security Measures

#### Token Security
- **Secure Storage**: Client-side secure token storage
- **Token Rotation**: Refresh token mechanism
- **Expiration**: Short-lived access tokens

#### Request Security
- **HTTPS Only**: Encrypted communication in production
- **CORS Protection**: Configured allowed origins
- **Security Headers**: Helmet.js security headers

#### Data Protection
- **Password Hashing**: bcrypt with salt rounds
- **Input Sanitization**: Joi validation and sanitization
- **SQL Injection Prevention**: Parameterized queries via TypeORM

This sequential flow ensures secure, validated, and efficient processing of user requests while maintaining system integrity and performance.
