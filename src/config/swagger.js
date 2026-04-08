const swaggerJsdoc = require('swagger-jsdoc');
const env = require('./env');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Team Task Manager API',
      version: '1.0.0',
      description: `
A RESTful API for managing team tasks and collaboration.

## Features
- 🔐 User Authentication (Register/Login/Logout)
- 👥 Team Management
- ✅ Task Management with Filtering
- 👤 Member Management with Roles
- 📊 Dashboard & Reminders

## Authentication
This API uses **session-based authentication** with HTTP-only cookies.
After logging in, the session cookie is automatically sent with each request.
      `,
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC',
      },
    },
    servers: [
      {
        url: env.isProduction 
          ? 'https://your-production-url.com/api' 
          : `http://localhost:${env.port}/api`,
        description: env.isProduction ? 'Production server' : 'Development server',
      },
    ],
    tags: [
      {
        name: 'Auth',
        description: 'Authentication endpoints',
      },
      {
        name: 'Teams',
        description: 'Team management endpoints',
      },
      {
        name: 'Members',
        description: 'Team member management endpoints',
      },
      {
        name: 'Tasks',
        description: 'Task management endpoints',
      },
    ],
    components: {
      securitySchemes: {
        sessionAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'sessionId',
          description: 'Session-based authentication using HTTP-only cookies',
        },
      },
      schemas: {
        // User schemas
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com',
            },
            first_name: {
              type: 'string',
              example: 'John',
            },
            last_name: {
              type: 'string',
              example: 'Doe',
            },
            avatar_url: {
              type: 'string',
              nullable: true,
              example: 'https://example.com/avatar.jpg',
            },
            is_active: {
              type: 'boolean',
              example: true,
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        
        // Auth schemas
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'first_name', 'last_name'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com',
            },
            password: {
              type: 'string',
              minLength: 8,
              example: 'Password123',
              description: 'Must contain uppercase, lowercase, and number',
            },
            first_name: {
              type: 'string',
              minLength: 1,
              maxLength: 100,
              example: 'John',
            },
            last_name: {
              type: 'string',
              minLength: 1,
              maxLength: 100,
              example: 'Doe',
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com',
            },
            password: {
              type: 'string',
              example: 'Password123',
            },
          },
        },
        
        // Team schemas
        Team: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
              example: 'Development Team',
            },
            description: {
              type: 'string',
              nullable: true,
              example: 'Frontend and Backend developers',
            },
            created_by: {
              type: 'string',
              format: 'uuid',
            },
            is_active: {
              type: 'boolean',
            },
            member_count: {
              type: 'integer',
              example: 5,
            },
            task_count: {
              type: 'integer',
              example: 12,
            },
            role: {
              type: 'string',
              enum: ['owner', 'admin', 'member'],
              description: 'Current user\'s role in this team',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        CreateTeamRequest: {
          type: 'object',
          required: ['name'],
          properties: {
            name: {
              type: 'string',
              minLength: 1,
              maxLength: 100,
              example: 'Development Team',
            },
            description: {
              type: 'string',
              maxLength: 500,
              example: 'Frontend and Backend developers',
            },
          },
        },
        UpdateTeamRequest: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              minLength: 1,
              maxLength: 100,
              example: 'Updated Team Name',
            },
            description: {
              type: 'string',
              maxLength: 500,
              example: 'Updated description',
            },
          },
        },
        
        // Membership schemas
        Member: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            user_id: {
              type: 'string',
              format: 'uuid',
            },
            team_id: {
              type: 'string',
              format: 'uuid',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            first_name: {
              type: 'string',
            },
            last_name: {
              type: 'string',
            },
            role: {
              type: 'string',
              enum: ['owner', 'admin', 'member'],
            },
            status: {
              type: 'string',
              enum: ['pending', 'active', 'inactive'],
            },
            joined_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        AddMemberRequest: {
          type: 'object',
          required: ['email'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'newmember@example.com',
            },
            role: {
              type: 'string',
              enum: ['admin', 'member'],
              default: 'member',
            },
          },
        },
        UpdateRoleRequest: {
          type: 'object',
          required: ['role'],
          properties: {
            role: {
              type: 'string',
              enum: ['admin', 'member'],
            },
          },
        },
        
        // Task schemas
        Task: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            title: {
              type: 'string',
              example: 'Implement login feature',
            },
            description: {
              type: 'string',
              nullable: true,
              example: 'Add login functionality with validation',
            },
            team_id: {
              type: 'string',
              format: 'uuid',
            },
            team_name: {
              type: 'string',
              example: 'Development Team',
            },
            created_by: {
              type: 'string',
              format: 'uuid',
            },
            assigned_to: {
              type: 'string',
              format: 'uuid',
              nullable: true,
            },
            assignee_first_name: {
              type: 'string',
              nullable: true,
            },
            assignee_last_name: {
              type: 'string',
              nullable: true,
            },
            status: {
              type: 'string',
              enum: ['todo', 'in_progress', 'review', 'completed'],
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'urgent'],
            },
            due_date: {
              type: 'string',
              format: 'date',
              nullable: true,
              example: '2024-12-31',
            },
            completed_at: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        CreateTaskRequest: {
          type: 'object',
          required: ['title', 'team_id'],
          properties: {
            title: {
              type: 'string',
              minLength: 1,
              maxLength: 255,
              example: 'Implement login feature',
            },
            description: {
              type: 'string',
              maxLength: 2000,
              example: 'Add login functionality with validation',
            },
            team_id: {
              type: 'string',
              format: 'uuid',
            },
            assigned_to: {
              type: 'string',
              format: 'uuid',
              nullable: true,
            },
            status: {
              type: 'string',
              enum: ['todo', 'in_progress', 'review', 'completed'],
              default: 'todo',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'urgent'],
              default: 'medium',
            },
            due_date: {
              type: 'string',
              format: 'date',
              nullable: true,
              example: '2024-12-31',
            },
          },
        },
        UpdateTaskRequest: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              minLength: 1,
              maxLength: 255,
            },
            description: {
              type: 'string',
              maxLength: 2000,
            },
            assigned_to: {
              type: 'string',
              format: 'uuid',
              nullable: true,
            },
            status: {
              type: 'string',
              enum: ['todo', 'in_progress', 'review', 'completed'],
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'urgent'],
            },
            due_date: {
              type: 'string',
              format: 'date',
              nullable: true,
            },
          },
        },
        
        // Dashboard schemas
        DashboardStats: {
          type: 'object',
          properties: {
            stats: {
              type: 'object',
              properties: {
                total: { type: 'integer', example: 25 },
                todo: { type: 'integer', example: 10 },
                in_progress: { type: 'integer', example: 8 },
                review: { type: 'integer', example: 3 },
                completed: { type: 'integer', example: 4 },
                due_soon: { type: 'integer', example: 5 },
                overdue: { type: 'integer', example: 2 },
              },
            },
            due_soon: {
              type: 'array',
              items: { $ref: '#/components/schemas/Task' },
            },
            overdue: {
              type: 'array',
              items: { $ref: '#/components/schemas/Task' },
            },
          },
        },
        
        // Response schemas
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Operation successful',
            },
            data: {
              type: 'object',
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            status: {
              type: 'string',
              example: 'fail',
            },
            message: {
              type: 'string',
              example: 'Error message here',
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                status: 'fail',
                message: 'Please log in to access this resource',
              },
            },
          },
        },
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                status: 'fail',
                message: 'You do not have permission to perform this action',
              },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                status: 'fail',
                message: 'Resource not found',
              },
            },
          },
        },
        ValidationError: {
          description: 'Validation failed',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                status: 'fail',
                message: 'Validation error details',
              },
            },
          },
        },
      },
    },
  },
  apis: [
    './src/modules/**/*.routes.js',
    './src/modules/**/*.controller.js',
    './src/routes.js',
  ],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;