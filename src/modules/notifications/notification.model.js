const { db } = require('../../config/db');

const TABLE_NAME = 'notifications';

const NotificationModel = {
  tableName: TABLE_NAME,

  /**
   * Create a new notification
   */
  create: async (notificationData) => {
    const [notification] = await db(TABLE_NAME)
      .insert(notificationData)
      .returning('*');
    return notification;
  },

  /**
   * Find notification by ID
   */
  findById: async (id) => {
    return db(TABLE_NAME)
      .select(
        'notifications.*',
        'actor.first_name as actor_first_name',
        'actor.last_name as actor_last_name',
        'actor.avatar_url as actor_avatar_url'
      )
      .leftJoin('users as actor', 'notifications.actor_id', 'actor.id')
      .where('notifications.id', id)
      .first();
  },

  /**
   * Find all notifications for a user
   */
  findByUser: async (userId, filters = {}) => {
    let query = db(TABLE_NAME)
      .select(
        'notifications.*',
        'actor.first_name as actor_first_name',
        'actor.last_name as actor_last_name',
        'actor.avatar_url as actor_avatar_url'
      )
      .leftJoin('users as actor', 'notifications.actor_id', 'actor.id')
      .where('notifications.user_id', userId);

    // Filter by read/unread
    if (filters.is_read !== undefined) {
      query = query.where('notifications.is_read', filters.is_read);
    }

    // Filter by type
    if (filters.type) {
      query = query.where('notifications.type', filters.type);
    }

    // Pagination
    const page = parseInt(filters.page, 10) || 1;
    const limit = parseInt(filters.limit, 10) || 20;
    const offset = (page - 1) * limit;

    query = query
      .orderBy('notifications.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return query;
  },

  /**
   * Count notifications for a user
   */
  countByUser: async (userId, filters = {}) => {
    let query = db(TABLE_NAME)
      .where('user_id', userId)
      .count('id as count');

    if (filters.is_read !== undefined) {
      query = query.where('is_read', filters.is_read);
    }

    if (filters.type) {
      query = query.where('type', filters.type);
    }

    const result = await query.first();
    return parseInt(result.count, 10);
  },

  /**
   * Count unread notifications
   */
  countUnread: async (userId) => {
    const result = await db(TABLE_NAME)
      .where({ user_id: userId, is_read: false })
      .count('id as count')
      .first();
    
    return parseInt(result.count, 10);
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (id) => {
    const [notification] = await db(TABLE_NAME)
      .where({ id })
      .update({
        is_read: true,
        read_at: db.fn.now(),
      })
      .returning('*');
    return notification;
  },

  /**
   * Mark all notifications as read for a user
   */
  markAllAsRead: async (userId) => {
    return db(TABLE_NAME)
      .where({ user_id: userId, is_read: false })
      .update({
        is_read: true,
        read_at: db.fn.now(),
      });
  },

  /**
   * Mark as unread
   */
  markAsUnread: async (id) => {
    const [notification] = await db(TABLE_NAME)
      .where({ id })
      .update({
        is_read: false,
        read_at: null,
      })
      .returning('*');
    return notification;
  },

  /**
   * Delete notification
   */
  delete: async (id) => {
    return db(TABLE_NAME).where({ id }).delete();
  },

  /**
   * Delete all notifications for a user
   */
  deleteByUser: async (userId) => {
    return db(TABLE_NAME).where({ user_id: userId }).delete();
  },

  /**
   * Delete old read notifications (cleanup job)
   */
  deleteOldRead: async (daysOld = 30) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return db(TABLE_NAME)
      .where('is_read', true)
      .where('created_at', '<', cutoffDate)
      .delete();
  },

  /**
   * Update email sent status
   */
  markEmailSent: async (id) => {
    return db(TABLE_NAME)
      .where({ id })
      .update({
        email_sent: true,
        email_sent_at: db.fn.now(),
      });
  },
};

module.exports = NotificationModel;