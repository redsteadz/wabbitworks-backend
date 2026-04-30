const { db } = require('../../config/db');

const TABLE_NAME = 'password_reset_tokens';

const PasswordResetTokenModel = {
  tableName: TABLE_NAME,

  /**
   * Create a new password reset token
   */
  create: async (data) => {
    const [token] = await db(TABLE_NAME)
      .insert(data)
      .returning('*');
    return token;
  },

  /**
   * Find token by hash
   */
  findByHash: async (tokenHash) => {
    return db(TABLE_NAME)
      .where({ token_hash: tokenHash })
      .whereNull('used_at')
      .first();
  },

  /**
   * Find valid token by hash (not expired, not used)
   */
  findValidByHash: async (tokenHash) => {
    return db(TABLE_NAME)
      .where({ token_hash: tokenHash })
      .whereNull('used_at')
      .where('expires_at', '>', db.fn.now())
      .first();
  },

  /**
   * Mark token as used
   */
  markAsUsed: async (id) => {
    const [token] = await db(TABLE_NAME)
      .where({ id })
      .update({ used_at: db.fn.now() })
      .returning('*');
    return token;
  },

  /**
   * Delete all tokens for user
   */
  deleteByUser: async (userId) => {
    return db(TABLE_NAME)
      .where({ user_id: userId })
      .delete();
  },

  /**
   * Delete expired tokens (cleanup job)
   */
  deleteExpired: async () => {
    return db(TABLE_NAME)
      .where('expires_at', '<', db.fn.now())
      .delete();
  },

  /**
   * Count recent tokens for rate limiting
   */
  countRecentByUser: async (userId, minutes = 60) => {
    const since = new Date();
    since.setMinutes(since.getMinutes() - minutes);

    const result = await db(TABLE_NAME)
      .where({ user_id: userId })
      .where('created_at', '>', since)
      .count('id as count')
      .first();

    return parseInt(result.count, 10);
  },
};

module.exports = PasswordResetTokenModel;