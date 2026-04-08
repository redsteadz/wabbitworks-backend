const { db } = require('../../config/db');

const TABLE_NAME = 'tasks';

// Task model for database operations
const TaskModel = {
  tableName: TABLE_NAME,

  // Find task by ID
  findById: (id) => {
    return db(TABLE_NAME).where({ id, is_active: true }).first();
  },

  // Find task by ID with related data
  findByIdWithDetails: (id) => {
    return db(TABLE_NAME)
      .select(
        'tasks.*',
        'creator.first_name as creator_first_name',
        'creator.last_name as creator_last_name',
        'creator.email as creator_email',
        'assignee.first_name as assignee_first_name',
        'assignee.last_name as assignee_last_name',
        'assignee.email as assignee_email',
        'teams.name as team_name'
      )
      .leftJoin('users as creator', 'tasks.created_by', 'creator.id')
      .leftJoin('users as assignee', 'tasks.assigned_to', 'assignee.id')
      .leftJoin('teams', 'tasks.team_id', 'teams.id')
      .where('tasks.id', id)
      .andWhere('tasks.is_active', true)
      .first();
  },

  // Find all tasks for a team with filters
  findByTeam: (teamId, filters = {}) => {
    let query = db(TABLE_NAME)
      .select(
        'tasks.*',
        'creator.first_name as creator_first_name',
        'creator.last_name as creator_last_name',
        'assignee.first_name as assignee_first_name',
        'assignee.last_name as assignee_last_name',
        'assignee.email as assignee_email'
      )
      .leftJoin('users as creator', 'tasks.created_by', 'creator.id')
      .leftJoin('users as assignee', 'tasks.assigned_to', 'assignee.id')
      .where('tasks.team_id', teamId)
      .andWhere('tasks.is_active', true);

    // Apply filters
    if (filters.status) {
      query = query.andWhere('tasks.status', filters.status);
    }

    if (filters.priority) {
      query = query.andWhere('tasks.priority', filters.priority);
    }

    if (filters.assigned_to) {
      query = query.andWhere('tasks.assigned_to', filters.assigned_to);
    }

    if (filters.created_by) {
      query = query.andWhere('tasks.created_by', filters.created_by);
    }

    if (filters.search) {
      query = query.andWhere((builder) => {
        builder
          .whereILike('tasks.title', `%${filters.search}%`)
          .orWhereILike('tasks.description', `%${filters.search}%`);
      });
    }

    // Apply sorting
    const sortBy = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder || 'desc';
    query = query.orderBy(`tasks.${sortBy}`, sortOrder);

    return query;
  },

  // Find all tasks for a user (assigned to or created by)
  findByUser: (userId, filters = {}) => {
    let query = db(TABLE_NAME)
      .select(
        'tasks.*',
        'teams.name as team_name',
        'assignee.first_name as assignee_first_name',
        'assignee.last_name as assignee_last_name'
      )
      .leftJoin('teams', 'tasks.team_id', 'teams.id')
      .leftJoin('users as assignee', 'tasks.assigned_to', 'assignee.id')
      .where('tasks.is_active', true)
      .andWhere((builder) => {
        builder
          .where('tasks.assigned_to', userId)
          .orWhere('tasks.created_by', userId);
      });

    // Apply team filter
    if (filters.team_id) {
      query = query.andWhere('tasks.team_id', filters.team_id);
    }

    // Apply status filter
    if (filters.status) {
      query = query.andWhere('tasks.status', filters.status);
    }

    // Apply priority filter
    if (filters.priority) {
      query = query.andWhere('tasks.priority', filters.priority);
    }

    // Only assigned to me
    if (filters.assigned_to_me) {
      query = query.andWhere('tasks.assigned_to', userId);
    }

    // Apply search
    if (filters.search) {
      query = query.andWhere((builder) => {
        builder
          .whereILike('tasks.title', `%${filters.search}%`)
          .orWhereILike('tasks.description', `%${filters.search}%`);
      });
    }

    return query.orderBy('tasks.created_at', 'desc');
  },

  // Get tasks due soon (for reminders)
  findDueSoon: (userId, daysAhead = 3) => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return db(TABLE_NAME)
      .select(
        'tasks.*',
        'teams.name as team_name'
      )
      .leftJoin('teams', 'tasks.team_id', 'teams.id')
      .where('tasks.assigned_to', userId)
      .andWhere('tasks.is_active', true)
      .andWhereNot('tasks.status', 'completed')
      .andWhere('tasks.due_date', '<=', futureDate)
      .andWhere('tasks.due_date', '>=', new Date())
      .orderBy('tasks.due_date', 'asc');
  },

  // Get overdue tasks
  findOverdue: (userId) => {
    return db(TABLE_NAME)
      .select(
        'tasks.*',
        'teams.name as team_name'
      )
      .leftJoin('teams', 'tasks.team_id', 'teams.id')
      .where('tasks.assigned_to', userId)
      .andWhere('tasks.is_active', true)
      .andWhereNot('tasks.status', 'completed')
      .andWhere('tasks.due_date', '<', new Date())
      .orderBy('tasks.due_date', 'asc');
  },

  // Create task
  create: (taskData) => {
    return db(TABLE_NAME)
      .insert(taskData)
      .returning('*')
      .then((rows) => rows[0]);
  },

  // Update task
  update: (id, taskData) => {
    const updateData = {
      ...taskData,
      updated_at: db.fn.now(),
    };

    // If status is being set to completed, set completed_at
    if (taskData.status === 'completed') {
      updateData.completed_at = db.fn.now();
    } else if (taskData.status && taskData.status !== 'completed') {
      updateData.completed_at = null;
    }

    return db(TABLE_NAME)
      .where({ id })
      .update(updateData)
      .returning('*')
      .then((rows) => rows[0]);
  },

  // Soft delete task
  softDelete: (id) => {
    return db(TABLE_NAME)
      .where({ id })
      .update({
        is_active: false,
        updated_at: db.fn.now(),
      });
  },
};

module.exports = TaskModel;