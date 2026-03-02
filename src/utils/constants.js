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

  // Pagination
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
  },
};