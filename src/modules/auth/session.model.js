const { db } = require('../../config/db');

const TABLE_NAME = 'session';

const SessionModel = {
  tableName: TABLE_NAME,

  /**
   * Find session by ID
   */
  findById: async (sid) => {
    return db(TABLE_NAME).where({ sid }).first();
  },

  /**
   * Find all sessions for a user
   */
  findByUser: async (userId) => {
    return db(TABLE_NAME)
      .where({ user_id: userId })
      .where('expire', '>', db.fn.now())
      .orderBy('last_activity_at', 'desc');
  },

  /**
   * Update session metadata
   */
  updateMetadata: async (sid, metadata) => {
    return db(TABLE_NAME)
      .where({ sid })
      .update({
        ...metadata,
        last_activity_at: db.fn.now(),
      });
  },

  /**
   * Delete session by ID
   */
  deleteById: async (sid) => {
    return db(TABLE_NAME).where({ sid }).delete();
  },

  /**
   * Delete all sessions for a user
   */
  deleteByUser: async (userId) => {
    return db(TABLE_NAME).where({ user_id: userId }).delete();
  },

  /**
   * Delete all sessions for a user except current
   */
  deleteByUserExcept: async (userId, currentSid) => {
    return db(TABLE_NAME)
      .where({ user_id: userId })
      .whereNot({ sid: currentSid })
      .delete();
  },

  /**
   * Count active sessions for a user
   */
  countByUser: async (userId) => {
    const result = await db(TABLE_NAME)
      .where({ user_id: userId })
      .where('expire', '>', db.fn.now())
      .count('sid as count')
      .first();

    return parseInt(result.count, 10);
  },

  /**
   * Delete expired sessions (cleanup job)
   */
  deleteExpired: async () => {
    return db(TABLE_NAME)
      .where('expire', '<', db.fn.now())
      .delete();
  },

  /**
   * Parse session data from JSON
   */
  parseSessionData: (session) => {
    if (!session) return null;

    let sessData = session.sess;
    if (typeof sessData === 'string') {
      try {
        sessData = JSON.parse(sessData);
      } catch (e) {
        sessData = {};
      }
    }

    return {
      sid: session.sid,
      userId: session.user_id,
      ipAddress: session.ip_address,
      userAgent: session.user_agent,
      deviceType: session.device_type,
      browser: session.browser,
      os: session.os,
      createdAt: session.created_at,
      lastActivityAt: session.last_activity_at,
      expiresAt: session.expire,
    };
  },
};

module.exports = SessionModel;