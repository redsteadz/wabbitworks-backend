module.exports = {
  // Task statuses
  TASK_STATUS: {
    TODO: 'todo',
    IN_PROGRESS: 'in_progress',
    REVIEW: 'review',
    COMPLETED: 'completed',
  },

  // Task priorities
  TASK_PRIORITY: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    URGENT: 'urgent',
  },

  // Membership roles
  MEMBERSHIP_ROLE: {
    OWNER: 'owner',
    ADMIN: 'admin',
    MEMBER: 'member',
  },

  // Membership status
  MEMBERSHIP_STATUS: {
    PENDING: 'pending',
    ACTIVE: 'active',
    INACTIVE: 'inactive',
  },

  // Invitation status
  INVITATION_STATUS: {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    DECLINED: 'declined',
    CANCELLED: 'cancelled',
  },

  // Notification types
  NOTIFICATION_TYPE: {
    TEAM_INVITATION: 'team_invitation',
    INVITATION_ACCEPTED: 'invitation_accepted',
    INVITATION_DECLINED: 'invitation_declined',
    TASK_ASSIGNED: 'task_assigned',
    TASK_UPDATED: 'task_updated',
    TASK_COMPLETED: 'task_completed',
    TASK_COMMENT: 'task_comment',
    MEMBER_ADDED: 'member_added',
    MEMBER_REMOVED: 'member_removed',
    ROLE_CHANGED: 'role_changed',
    DUE_DATE_REMINDER: 'due_date_reminder',
    TASK_OVERDUE: 'task_overdue',
  },

  // Pagination
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
  },

  // Token types
  TOKEN_TYPE: {
    EMAIL_VERIFICATION: 'email_verification',
    EMAIL_CHANGE: 'email_change',
    PASSWORD_RESET: 'password_reset',
  },

  // Session
  SESSION: {
    MAX_SESSIONS_PER_USER: 5,
  },

  // Invitations
  INVITATION: {
    EXPIRY_DAYS: 7, // Invitations expire after 7 days
  },
};
