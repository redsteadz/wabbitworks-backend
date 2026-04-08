const { db } = require('../../config/db');

const TABLE_NAME = 'memberships';

// Membership model for database operations
const MembershipModel = {
  tableName: TABLE_NAME,

// Find membership by ID
  findById: (id) => {
    return db(TABLE_NAME).where({ id }).first();
  },

// Find membership by user and team
  findByUserAndTeam: (userId, teamId) => {
    return db(TABLE_NAME)
      .where({ user_id: userId, team_id: teamId })
      .first();
  },

// Find all memberships for a user
  findByUser: (userId) => {
    return db(TABLE_NAME)
      .select(
        'memberships.*',
        'teams.name as team_name',
        'teams.description as team_description'
      )
      .join('teams', 'memberships.team_id', 'teams.id')
      .where('memberships.user_id', userId)
      .andWhere('memberships.status', 'active')
      .andWhere('teams.is_active', true);
  },

// Find all members of a team
  findByTeam: (teamId) => {
    return db(TABLE_NAME)
      .select(
        'memberships.*',
        'users.email',
        'users.first_name',
        'users.last_name',
        'users.avatar_url'
      )
      .join('users', 'memberships.user_id', 'users.id')
      .where('memberships.team_id', teamId)
      .andWhere('memberships.status', 'active')
      .andWhere('users.is_active', true)
      .orderBy('memberships.role');
  },

// Create membership
  create: (membershipData) => {
    return db(TABLE_NAME)
      .insert(membershipData)
      .returning('*')
      .then((rows) => rows[0]);
  },

// Update membership
  update: (id, membershipData) => {
    return db(TABLE_NAME)
      .where({ id })
      .update({
        ...membershipData,
        updated_at: db.fn.now(),
      })
      .returning('*')
      .then((rows) => rows[0]);
  },

// Delete membership
  delete: (id) => {
    return db(TABLE_NAME).where({ id }).del();
  },

// Delete by user and team
  deleteByUserAndTeam: (userId, teamId) => {
    return db(TABLE_NAME)
      .where({ user_id: userId, team_id: teamId })
      .del();
  },
};

module.exports = MembershipModel;