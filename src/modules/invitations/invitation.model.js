const { db } = require('../../config/db');

const TABLE_NAME = 'team_invitations';

const InvitationModel = {
  tableName: TABLE_NAME,

  /**
   * Create a new invitation
   */
  create: async (invitationData) => {
    const [invitation] = await db(TABLE_NAME)
      .insert(invitationData)
      .returning('*');
    return invitation;
  },

  /**
   * Find invitation by ID
   */
  findById: async (id) => {
    return db(TABLE_NAME)
      .select(
        'team_invitations.*',
        'teams.name as team_name',
        'teams.description as team_description',
        'inviter.first_name as inviter_first_name',
        'inviter.last_name as inviter_last_name',
        'inviter.email as inviter_email',
        'inviter.avatar_url as inviter_avatar_url',
        'invited.first_name as invited_first_name',
        'invited.last_name as invited_last_name',
        'invited.email as invited_email',
        'invited.avatar_url as invited_avatar_url'
      )
      .leftJoin('teams', 'team_invitations.team_id', 'teams.id')
      .leftJoin('users as inviter', 'team_invitations.invited_by', 'inviter.id')
      .leftJoin('users as invited', 'team_invitations.invited_user_id', 'invited.id')
      .where('team_invitations.id', id)
      .first();
  },

  /**
   * Find pending invitation by team and user
   */
  findPendingByTeamAndUser: async (teamId, userId) => {
    return db(TABLE_NAME)
      .where({
        team_id: teamId,
        invited_user_id: userId,
        status: 'pending',
      })
      .where('expires_at', '>', db.fn.now())
      .first();
  },

  /**
   * Find all invitations for a user (received)
   */
  findByInvitedUser: async (userId, filters = {}) => {
    let query = db(TABLE_NAME)
      .select(
        'team_invitations.*',
        'teams.name as team_name',
        'teams.description as team_description',
        'inviter.first_name as inviter_first_name',
        'inviter.last_name as inviter_last_name',
        'inviter.email as inviter_email',
        'inviter.avatar_url as inviter_avatar_url'
      )
      .leftJoin('teams', 'team_invitations.team_id', 'teams.id')
      .leftJoin('users as inviter', 'team_invitations.invited_by', 'inviter.id')
      .where('team_invitations.invited_user_id', userId)
      .andWhere('teams.is_active', true);

    // Filter by status
    if (filters.status) {
      query = query.where('team_invitations.status', filters.status);
    } else {
      // Default to pending and not expired
      query = query
        .where('team_invitations.status', 'pending')
        .where('team_invitations.expires_at', '>', db.fn.now());
    }

    return query.orderBy('team_invitations.created_at', 'desc');
  },

  /**
   * Find all invitations sent by a user
   */
  findByInviter: async (userId, filters = {}) => {
    let query = db(TABLE_NAME)
      .select(
        'team_invitations.*',
        'teams.name as team_name',
        'invited.first_name as invited_first_name',
        'invited.last_name as invited_last_name',
        'invited.email as invited_email',
        'invited.avatar_url as invited_avatar_url'
      )
      .leftJoin('teams', 'team_invitations.team_id', 'teams.id')
      .leftJoin('users as invited', 'team_invitations.invited_user_id', 'invited.id')
      .where('team_invitations.invited_by', userId)
      .andWhere('teams.is_active', true);

    if (filters.status) {
      query = query.where('team_invitations.status', filters.status);
    }

    if (filters.team_id) {
      query = query.where('team_invitations.team_id', filters.team_id);
    }

    return query.orderBy('team_invitations.created_at', 'desc');
  },

  /**
   * Find all invitations for a team
   */
  findByTeam: async (teamId, filters = {}) => {
    let query = db(TABLE_NAME)
      .select(
        'team_invitations.*',
        'invited.first_name as invited_first_name',
        'invited.last_name as invited_last_name',
        'invited.email as invited_email',
        'invited.avatar_url as invited_avatar_url',
        'inviter.first_name as inviter_first_name',
        'inviter.last_name as inviter_last_name'
      )
      .leftJoin('users as invited', 'team_invitations.invited_user_id', 'invited.id')
      .leftJoin('users as inviter', 'team_invitations.invited_by', 'inviter.id')
      .where('team_invitations.team_id', teamId);

    if (filters.status) {
      query = query.where('team_invitations.status', filters.status);
    } else {
      // Default to pending
      query = query.where('team_invitations.status', 'pending');
    }

    return query.orderBy('team_invitations.created_at', 'desc');
  },

  /**
   * Update invitation
   */
  update: async (id, data) => {
    const [invitation] = await db(TABLE_NAME)
      .where({ id })
      .update({
        ...data,
        updated_at: db.fn.now(),
      })
      .returning('*');
    return invitation;
  },

  /**
   * Accept invitation
   */
  accept: async (id) => {
    const [invitation] = await db(TABLE_NAME)
      .where({ id })
      .update({
        status: 'accepted',
        responded_at: db.fn.now(),
        updated_at: db.fn.now(),
      })
      .returning('*');
    return invitation;
  },

  /**
   * Decline invitation
   */
  decline: async (id) => {
    const [invitation] = await db(TABLE_NAME)
      .where({ id })
      .update({
        status: 'declined',
        responded_at: db.fn.now(),
        updated_at: db.fn.now(),
      })
      .returning('*');
    return invitation;
  },

  /**
   * Cancel invitation
   */
  cancel: async (id) => {
    const [invitation] = await db(TABLE_NAME)
      .where({ id })
      .update({
        status: 'cancelled',
        updated_at: db.fn.now(),
      })
      .returning('*');
    return invitation;
  },

  /**
   * Delete invitation
   */
  delete: async (id) => {
    return db(TABLE_NAME).where({ id }).delete();
  },

  /**
   * Count pending invitations for a user
   */
  countPendingByUser: async (userId) => {
    const result = await db(TABLE_NAME)
      .where({
        invited_user_id: userId,
        status: 'pending',
      })
      .where('expires_at', '>', db.fn.now())
      .count('id as count')
      .first();

    return parseInt(result.count, 10);
  },

  /**
   * Expire old pending invitations
   */
  expireOld: async () => {
    return db(TABLE_NAME)
      .where('status', 'pending')
      .where('expires_at', '<', db.fn.now())
      .update({
        status: 'expired',
        updated_at: db.fn.now(),
      });
  },
};

module.exports = InvitationModel;