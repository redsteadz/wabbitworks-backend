const {
  TASK_STATUS,
  TASK_PRIORITY,
  MEMBERSHIP_ROLE,
  MEMBERSHIP_STATUS,
  INVITATION_STATUS,
  NOTIFICATION_TYPE,
} = require('../utils/constants');

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];

const PUBLIC_OPERATIONS = new Set([
  'GET /auth/google',
  'GET /auth/google/callback',
  'POST /auth/register',
  'POST /auth/login',
  'GET /auth/status',
  'GET /auth/verify-email',
  'POST /auth/forgot-password',
  'GET /auth/reset-password',
  'POST /auth/reset-password',
  'GET /invitations/public/{id}/accept',
  'GET /invitations/public/{id}/decline',
  'GET /health',
]);

const TAGS = [
  { name: 'Auth', description: 'Authentication endpoints' },
  { name: 'Auth - Email Verification', description: 'Verification email and code flows' },
  { name: 'Auth - Password Reset', description: 'Password reset request and completion' },
  { name: 'Auth - Password Management', description: 'Authenticated password changes' },
  { name: 'Auth - Email Management', description: 'Authenticated email change flows' },
  { name: 'Auth - Session Management', description: 'Session listing and invalidation' },
  { name: 'Teams', description: 'Team management endpoints' },
  { name: 'Members', description: 'Team membership management endpoints' },
  { name: 'Tasks', description: 'Task management endpoints' },
  { name: 'Invitations', description: 'Invitation lifecycle endpoints' },
  { name: 'Notifications', description: 'Notification and preference endpoints' },
  { name: 'Health', description: 'Service health check' },
];

const clone = (value) => JSON.parse(JSON.stringify(value));

const isPlainObject = (value) => (
  value !== null && typeof value === 'object' && !Array.isArray(value)
);

const mergeDeep = (base = {}, patch = {}) => {
  const output = clone(base);

  for (const [key, value] of Object.entries(patch)) {
    if (key === 'properties' && isPlainObject(base.properties) && isPlainObject(value)) {
      output.properties = { ...base.properties, ...clone(value) };
      continue;
    }

    if (key === 'required' && Array.isArray(base.required) && Array.isArray(value)) {
      output.required = Array.from(new Set([...base.required, ...value]));
      continue;
    }

    if (isPlainObject(base[key]) && isPlainObject(value)) {
      output[key] = mergeDeep(base[key], value);
      continue;
    }

    output[key] = clone(value);
  }

  return output;
};

const makeRef = (name) => ({ $ref: `#/components/schemas/${name}` });

const makeEnvelope = (dataProperties) => ({
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
      properties: dataProperties,
    },
  },
});

const makeListEnvelope = (itemKey, itemSchemaName, extraDataProperties = {}) => makeEnvelope({
  [itemKey]: {
    type: 'array',
    items: makeRef(itemSchemaName),
  },
  ...extraDataProperties,
});

const makeSingleEnvelope = (itemKey, itemSchemaName, extraDataProperties = {}) => makeEnvelope({
  [itemKey]: makeRef(itemSchemaName),
  ...extraDataProperties,
});

const notificationPreferenceFields = {
  email_team_invitation: {
    type: 'boolean',
    example: true,
  },
  email_invitation_response: {
    type: 'boolean',
    example: true,
  },
  email_task_assigned: {
    type: 'boolean',
    example: true,
  },
  email_task_updated: {
    type: 'boolean',
    example: false,
  },
  email_task_completed: {
    type: 'boolean',
    example: false,
  },
  email_due_date_reminder: {
    type: 'boolean',
    example: true,
  },
  email_task_overdue: {
    type: 'boolean',
    example: true,
  },
  email_member_added: {
    type: 'boolean',
    example: false,
  },
  email_role_changed: {
    type: 'boolean',
    example: true,
  },
  inapp_team_invitation: {
    type: 'boolean',
    example: true,
  },
  inapp_invitation_response: {
    type: 'boolean',
    example: true,
  },
  inapp_task_assigned: {
    type: 'boolean',
    example: true,
  },
  inapp_task_updated: {
    type: 'boolean',
    example: true,
  },
  inapp_task_completed: {
    type: 'boolean',
    example: true,
  },
  inapp_due_date_reminder: {
    type: 'boolean',
    example: true,
  },
  inapp_task_overdue: {
    type: 'boolean',
    example: true,
  },
  inapp_member_added: {
    type: 'boolean',
    example: true,
  },
  inapp_role_changed: {
    type: 'boolean',
    example: true,
  },
};

const schemaPatches = {
  User: {
    properties: {
      email_verified: {
        type: 'boolean',
        example: true,
      },
      email_verified_at: {
        type: 'string',
        format: 'date-time',
        nullable: true,
      },
      pending_email: {
        type: 'string',
        format: 'email',
        nullable: true,
      },
      pending_email_created_at: {
        type: 'string',
        format: 'date-time',
        nullable: true,
      },
      last_login_at: {
        type: 'string',
        format: 'date-time',
        nullable: true,
      },
      google_id: {
        type: 'string',
        nullable: true,
        example: 'google-oauth2|1234567890',
      },
    },
  },
  Team: {
    properties: {
      creator_first_name: {
        type: 'string',
        nullable: true,
        example: 'Jane',
      },
      creator_last_name: {
        type: 'string',
        nullable: true,
        example: 'Smith',
      },
      creator_email: {
        type: 'string',
        format: 'email',
        nullable: true,
        example: 'jane@example.com',
      },
    },
  },
  Member: {
    properties: {
      avatar_url: {
        type: 'string',
        format: 'uri',
        nullable: true,
        example: 'https://example.com/avatar.jpg',
      },
    },
  },
  Membership: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
      },
      user_id: {
        type: 'string',
        format: 'uuid',
      },
      team_id: {
        type: 'string',
        format: 'uuid',
      },
      invitation_id: {
        type: 'string',
        format: 'uuid',
        nullable: true,
      },
      role: {
        type: 'string',
        enum: Object.values(MEMBERSHIP_ROLE),
      },
      status: {
        type: 'string',
        enum: Object.values(MEMBERSHIP_STATUS),
      },
      invited_email: {
        type: 'string',
        format: 'email',
        nullable: true,
      },
      joined_at: {
        type: 'string',
        format: 'date-time',
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
  TeamMembership: {
    allOf: [
      makeRef('Membership'),
      {
        type: 'object',
        properties: {
          team_name: {
            type: 'string',
            example: 'Development Team',
          },
          team_description: {
            type: 'string',
            nullable: true,
            example: 'Frontend and Backend developers',
          },
        },
      },
    ],
  },
  Task: {
    properties: {
      creator_first_name: {
        type: 'string',
        nullable: true,
        example: 'Jane',
      },
      creator_last_name: {
        type: 'string',
        nullable: true,
        example: 'Smith',
      },
      creator_email: {
        type: 'string',
        format: 'email',
        nullable: true,
        example: 'jane@example.com',
      },
      assignee_email: {
        type: 'string',
        format: 'email',
        nullable: true,
        example: 'john@example.com',
      },
    },
  },
  Notification: {
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
      actor_id: {
        type: 'string',
        format: 'uuid',
        nullable: true,
      },
      type: {
        type: 'string',
        enum: Object.values(NOTIFICATION_TYPE),
      },
      title: {
        type: 'string',
        example: 'Task Assigned',
      },
      message: {
        type: 'string',
        example: 'You have been assigned a new task',
      },
      metadata: {
        type: 'object',
        nullable: true,
        additionalProperties: true,
        example: {
          taskId: '123e4567-e89b-12d3-a456-426614174000',
          teamId: '123e4567-e89b-12d3-a456-426614174001',
        },
      },
      action_url: {
        type: 'string',
        format: 'uri',
        nullable: true,
      },
      is_read: {
        type: 'boolean',
        example: false,
      },
      read_at: {
        type: 'string',
        format: 'date-time',
        nullable: true,
      },
      email_sent: {
        type: 'boolean',
        example: true,
      },
      email_sent_at: {
        type: 'string',
        format: 'date-time',
        nullable: true,
      },
      created_at: {
        type: 'string',
        format: 'date-time',
      },
      actor_first_name: {
        type: 'string',
        nullable: true,
      },
      actor_last_name: {
        type: 'string',
        nullable: true,
      },
      actor_avatar_url: {
        type: 'string',
        format: 'uri',
        nullable: true,
      },
    },
  },
  NotificationPreferences: {
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
      ...notificationPreferenceFields,
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
  Invitation: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
      },
      team_id: {
        type: 'string',
        format: 'uuid',
      },
      invited_user_id: {
        type: 'string',
        format: 'uuid',
      },
      invited_by: {
        type: 'string',
        format: 'uuid',
      },
      invited_email: {
        type: 'string',
        format: 'email',
      },
      role: {
        type: 'string',
        enum: Object.values(MEMBERSHIP_ROLE).filter((role) => role !== MEMBERSHIP_ROLE.OWNER),
      },
      status: {
        type: 'string',
        enum: Object.values(INVITATION_STATUS),
      },
      message: {
        type: 'string',
        nullable: true,
        maxLength: 500,
      },
      responded_at: {
        type: 'string',
        format: 'date-time',
        nullable: true,
      },
      expires_at: {
        type: 'string',
        format: 'date-time',
      },
      created_at: {
        type: 'string',
        format: 'date-time',
      },
      updated_at: {
        type: 'string',
        format: 'date-time',
      },
      team_name: {
        type: 'string',
        example: 'Development Team',
      },
      team_description: {
        type: 'string',
        nullable: true,
      },
      inviter_first_name: {
        type: 'string',
        nullable: true,
      },
      inviter_last_name: {
        type: 'string',
        nullable: true,
      },
      inviter_email: {
        type: 'string',
        format: 'email',
        nullable: true,
      },
      inviter_avatar_url: {
        type: 'string',
        format: 'uri',
        nullable: true,
      },
      invited_first_name: {
        type: 'string',
        nullable: true,
      },
      invited_last_name: {
        type: 'string',
        nullable: true,
      },
      invited_avatar_url: {
        type: 'string',
        format: 'uri',
        nullable: true,
      },
    },
  },
  SessionInfo: {
    type: 'object',
    properties: {
      sid: {
        type: 'string',
      },
      userId: {
        type: 'string',
        format: 'uuid',
      },
      ipAddress: {
        type: 'string',
        nullable: true,
      },
      userAgent: {
        type: 'string',
        nullable: true,
      },
      deviceType: {
        type: 'string',
      },
      browser: {
        type: 'string',
      },
      os: {
        type: 'string',
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
      },
      lastActivityAt: {
        type: 'string',
        format: 'date-time',
      },
      expiresAt: {
        type: 'string',
        format: 'date-time',
      },
      isCurrent: {
        type: 'boolean',
      },
    },
  },
  UpdateAvatarRequest: {
    type: 'object',
    properties: {
      avatar_url: {
        type: 'string',
        format: 'uri',
        maxLength: 500,
        nullable: true,
        example: 'https://example.com/avatar.jpg',
        description: 'Profile avatar URL when not uploading a file.',
      },
    },
  },
  UpdateAvatarMultipartRequest: {
    type: 'object',
    properties: {
      avatar: {
        type: 'string',
        format: 'binary',
        description: 'Avatar image file upload.',
      },
      avatar_url: {
        type: 'string',
        format: 'uri',
        maxLength: 500,
        nullable: true,
        example: 'https://example.com/avatar.jpg',
        description: 'Optional avatar URL if you are not uploading a file.',
      },
    },
  },
  NotificationPreferencesUpdateRequest: {
    type: 'object',
    minProperties: 1,
    additionalProperties: false,
    properties: notificationPreferenceFields,
  },
  AuthUserResponse: makeSingleEnvelope('user', 'User'),
  ProfileResponse: makeEnvelope({
    user: makeRef('User'),
    teams: {
      type: 'array',
      items: makeRef('TeamMembership'),
    },
  }),
  AuthStatusResponse: makeEnvelope({
    isAuthenticated: {
      type: 'boolean',
      example: true,
    },
    user: {
      type: 'object',
      nullable: true,
    },
  }),
  TeamResponse: makeSingleEnvelope('team', 'Team'),
  TeamListResponse: makeListEnvelope('teams', 'Team'),
  MemberListResponse: makeListEnvelope('members', 'Member'),
  MembershipResponse: makeSingleEnvelope('membership', 'Membership'),
  TaskResponse: makeSingleEnvelope('task', 'Task'),
  TaskListResponse: makeListEnvelope('tasks', 'Task'),
  NotificationResponse: makeSingleEnvelope('notification', 'Notification'),
  NotificationListResponse: makeEnvelope({
    notifications: {
      type: 'array',
      items: makeRef('Notification'),
    },
    pagination: {
      type: 'object',
      properties: {
        total: {
          type: 'integer',
        },
        unread: {
          type: 'integer',
        },
        page: {
          type: 'integer',
        },
        limit: {
          type: 'integer',
        },
      },
    },
  }),
  NotificationPreferencesResponse: makeSingleEnvelope('preferences', 'NotificationPreferences'),
  InvitationResponse: makeSingleEnvelope('invitation', 'Invitation'),
  InvitationListResponse: makeListEnvelope('invitations', 'Invitation'),
  InvitationActionResponse: makeEnvelope({
    invitation: makeRef('Invitation'),
    membership: makeRef('Membership'),
  }),
  SessionListResponse: makeListEnvelope('sessions', 'SessionInfo'),
  CountResponse: makeEnvelope({
    count: {
      type: 'integer',
      example: 3,
    },
  }),
};

const requestBodyOverrides = {
  'PATCH /auth/me/avatar': {
    'multipart/form-data': 'UpdateAvatarMultipartRequest',
    'application/json': 'UpdateAvatarRequest',
  },
  'PUT /notifications/preferences': {
    'application/json': 'NotificationPreferencesUpdateRequest',
  },
};

const responseOverrides = [
  ['POST /auth/register', 201, 'AuthUserResponse'],
  ['POST /auth/login', 200, 'AuthUserResponse'],
  ['GET /auth/verify-email', 200, 'AuthUserResponse'],
  ['POST /auth/verify-email', 200, 'AuthUserResponse'],
  ['GET /auth/status', 200, 'AuthStatusResponse'],
  ['GET /auth/me', 200, 'ProfileResponse'],
  ['PATCH /auth/me/avatar', 200, 'ProfileResponse'],
  ['DELETE /auth/me/avatar', 200, 'ProfileResponse'],
  ['GET /auth/sessions', 200, 'SessionListResponse'],
  ['GET /teams', 200, 'TeamListResponse'],
  ['POST /teams', 201, 'TeamResponse'],
  ['GET /teams/{id}', 200, 'TeamResponse'],
  ['PUT /teams/{id}', 200, 'TeamResponse'],
  ['GET /teams/{id}/members', 200, 'MemberListResponse'],
  ['GET /teams/{teamId}/members', 200, 'MemberListResponse'],
  ['PUT /teams/{id}/members/{memberId}', 200, 'MembershipResponse'],
  ['PUT /teams/{teamId}/members/{memberId}', 200, 'MembershipResponse'],
  ['GET /tasks', 200, 'TaskListResponse'],
  ['POST /tasks', 201, 'TaskResponse'],
  ['GET /tasks/{id}', 200, 'TaskResponse'],
  ['PUT /tasks/{id}', 200, 'TaskResponse'],
  ['GET /tasks/due-soon', 200, 'TaskListResponse'],
  ['GET /tasks/overdue', 200, 'TaskListResponse'],
  ['GET /teams/{teamId}/tasks', 200, 'TaskListResponse'],
  ['GET /notifications/unread/count', 200, 'CountResponse'],
  ['GET /notifications/preferences', 200, 'NotificationPreferencesResponse'],
  ['PUT /notifications/preferences', 200, 'NotificationPreferencesResponse'],
  ['GET /notifications', 200, 'NotificationListResponse'],
  ['GET /notifications/{id}', 200, 'NotificationResponse'],
  ['PUT /notifications/{id}/read', 200, 'NotificationResponse'],
  ['PUT /notifications/{id}/unread', 200, 'NotificationResponse'],
  ['GET /invitations/pending/count', 200, 'CountResponse'],
  ['GET /invitations/received', 200, 'InvitationListResponse'],
  ['GET /invitations/sent', 200, 'InvitationListResponse'],
  ['GET /invitations/{id}', 200, 'InvitationResponse'],
  ['POST /invitations/{id}/accept', 200, 'InvitationActionResponse'],
  ['POST /invitations/{id}/decline', 200, 'InvitationResponse'],
  ['POST /invitations/{id}/cancel', 200, 'InvitationResponse'],
  ['POST /invitations/{id}/resend', 200, 'InvitationResponse'],
  ['GET /teams/{teamId}/invitations', 200, 'InvitationListResponse'],
  ['POST /teams/{teamId}/invitations', 201, 'InvitationResponse'],
];

const applySchemaPatches = (spec) => {
  spec.components = spec.components || {};
  spec.components.schemas = spec.components.schemas || {};

  for (const [schemaName, patch] of Object.entries(schemaPatches)) {
    const existing = spec.components.schemas[schemaName] || {};
    spec.components.schemas[schemaName] = mergeDeep(existing, patch);
  }

  return spec;
};

const applyTags = (spec) => {
  const existing = Array.isArray(spec.tags) ? spec.tags : [];
  const existingMap = new Map(existing.map((tag) => [tag.name, tag]));
  const ordered = [];

  for (const tag of TAGS) {
    if (existingMap.has(tag.name)) {
      ordered.push({ ...tag, ...existingMap.get(tag.name) });
      existingMap.delete(tag.name);
      continue;
    }

    ordered.push(tag);
  }

  for (const tag of existingMap.values()) {
    ordered.push(tag);
  }

  spec.tags = ordered;
  return spec;
};

const applyDescription = (spec) => {
  if (!spec.info) {
    spec.info = {};
  }

  spec.info.description = [
    'A RESTful API for managing team tasks and collaboration.',
    '',
    'Features',
    '- User authentication: register, login, logout, OAuth, email verification, and password reset',
    '- Team management and role-based member administration',
    '- Task management with filters, dashboards, and reminders',
    '- Invitation workflows for teams and members',
    '- Notification feeds and preference controls',
    '- Downloadable OpenAPI JSON plus a generated Postman collection',
    '',
    'Authentication',
    'This API uses session-based authentication with HTTP-only cookies.',
    'After logging in, the session cookie is automatically sent with each request.',
  ].join('\n');

  return spec;
};

const setRequestBodySchema = (operation, contentType, schemaName) => {
  operation.requestBody = operation.requestBody || { required: true, content: {} };
  operation.requestBody.content = operation.requestBody.content || {};
  operation.requestBody.content[contentType] = {
    schema: makeRef(schemaName),
  };
};

const applyRequestOverrides = (spec) => {
  for (const [operationKey, contentMap] of Object.entries(requestBodyOverrides)) {
    const [method, ...pathParts] = operationKey.split(' ');
    const path = pathParts.join(' ');
    const operation = spec.paths?.[path]?.[method.toLowerCase()];

    if (!operation) {
      continue;
    }

    operation.requestBody = operation.requestBody || { required: true, content: {} };
    operation.requestBody.content = operation.requestBody.content || {};

    for (const [contentType, schemaName] of Object.entries(contentMap)) {
      setRequestBodySchema(operation, contentType, schemaName);
    }
  }

  return spec;
};

const setResponseSchema = (operation, status, schemaName, description) => {
  operation.responses = operation.responses || {};
  const existing = operation.responses[status] || {};

  operation.responses[status] = {
    description: description || existing.description || 'Success',
    content: {
      'application/json': {
        schema: makeRef(schemaName),
      },
    },
  };
};

const applyResponseOverrides = (spec) => {
  for (const [operationKey, status, schemaName] of responseOverrides) {
    const [method, ...pathParts] = operationKey.split(' ');
    const path = pathParts.join(' ');
    const operation = spec.paths?.[path]?.[method.toLowerCase()];

    if (!operation) {
      continue;
    }

    setResponseSchema(operation, status, schemaName);
  }

  return spec;
};

const applyDefaultSecurity = (spec) => {
  for (const [path, pathItem] of Object.entries(spec.paths || {})) {
    for (const method of HTTP_METHODS) {
      const operation = pathItem[method];

      if (!operation) {
        continue;
      }

      const operationKey = `${method.toUpperCase()} ${path}`;
      if (!PUBLIC_OPERATIONS.has(operationKey) && (!operation.security || operation.security.length === 0)) {
        operation.security = [{ sessionAuth: [] }];
      }

      if (!PUBLIC_OPERATIONS.has(operationKey)) {
        operation.responses = operation.responses || {};
        if (!operation.responses['401']) {
          operation.responses['401'] = {
            $ref: '#/components/responses/UnauthorizedError',
          };
        }
      }
    }
  }

  return spec;
};

const enhanceSwaggerSpec = (spec) => {
  const enhanced = clone(spec);
  enhanced.openapi = '3.0.3';

  applyDescription(enhanced);
  applyTags(enhanced);
  applySchemaPatches(enhanced);
  applyRequestOverrides(enhanced);
  applyResponseOverrides(enhanced);
  applyDefaultSecurity(enhanced);

  return enhanced;
};

module.exports = {
  enhanceSwaggerSpec,
  makeRef,
};
