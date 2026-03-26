const { db } = require('../../config/db');

const TABLE_NAME = 'teams';

// Team model for database operations
const TeamModel = {
  tableName: TABLE_NAME,

  // Find team by ID
  findById: (id) => {
    return db(TABLE_NAME).where({ id, is_active: true }).first();
  },

  // Find team by ID with creator info
  findByIdWithCreator: (id) => {
    return db(TABLE_NAME)
      .select(
        'teams.*',
        'users.first_name as creator_first_name',
        'users.last_name as creator_last_name',
        'users.email as creator_email'
      )
      .leftJoin('users', 'teams.created_by', 'users.id')
      .where('teams.id', id)
      .andWhere('teams.is_active', true)
      .first();
  },

  // Create a new team
  create: (teamData) => {
    return db(TABLE_NAME)
      .insert(teamData)
      .returning('*')
      .then((rows) => rows[0]);
  },

  // Update team
  update: (id, teamData) => {
    return db(TABLE_NAME)
      .where({ id })
      .update({
        ...teamData,
        updated_at: db.fn.now(),
      })
      .returning('*')
      .then((rows) => rows[0]);
  },

  // Soft delete team
  softDelete: (id) => {
    return db(TABLE_NAME)
      .where({ id })
      .update({
        is_active: false,
        updated_at: db.fn.now(),
      });
  },

  // Get teams by user (through memberships)
  findByUser: (userId) => {
    return db(TABLE_NAME)
      .select(
        'teams.*',
        'memberships.role',
        'memberships.status',
        'users.first_name as creator_first_name',
        'users.last_name as creator_last_name'
      )
      .join('memberships', 'teams.id', 'memberships.team_id')
      .leftJoin('users', 'teams.created_by', 'users.id')
      .where('memberships.user_id', userId)
      .andWhere('memberships.status', 'active')
      .andWhere('teams.is_active', true)
      .orderBy('teams.created_at', 'desc');
  },

  // Get member count for a team
  getMemberCount: (teamId) => {
    return db('memberships')
      .where({ team_id: teamId, status: 'active' })
      .count('id as count')
      .first()
      .then((result) => parseInt(result.count, 10));
  },

  // Get task count for a team
  getTaskCount: (teamId) => {
    return db('tasks')
      .where({ team_id: teamId, is_active: true })
      .count('id as count')
      .first()
      .then((result) => parseInt(result.count, 10));
  },
};

module.exports = TeamModel;