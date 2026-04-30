const { db } = require('../../config/db');

const TABLE_NAME = 'verification_tokens';

const VerificationTokenModel = {
  tableName: TABLE_NAME,

  /**
   * Create a new verification token
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
   * Find latest unused token for user by type
   */
  findLatestByUserAndType: async (userId, type) => {
    return db(TABLE_NAME)
      .where({ user_id: userId, type })
      .whereNull('used_at')
      .where('expires_at', '>', db.fn.now())
      .orderBy('created_at', 'desc')
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
   * Delete all tokens for user by type
   */
  deleteByUserAndType: async (userId, type) => {
    return db(TABLE_NAME)
      .where({ user_id: userId, type })
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
  countRecentByUser: async (userId, type, minutes = 60) => {
    const since = new Date();
    since.setMinutes(since.getMinutes() - minutes);

    const result = await db(TABLE_NAME)
      .where({ user_id: userId, type })
      .where('created_at', '>', since)
      .count('id as count')
      .first();

    return parseInt(result.count, 10);
  },
};

module.exports = VerificationTokenModel;