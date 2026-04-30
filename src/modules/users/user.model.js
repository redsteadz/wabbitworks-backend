const { db } = require('../../config/db');

const TABLE_NAME = 'users';

// User model for database operations
const UserModel = {
  tableName: TABLE_NAME,

  // Find user by ID
  findById: (id) => {
    return db(TABLE_NAME).where({ id, is_active: true }).first();
  },

  // Find user by ID (including inactive)
  findByIdAll: (id) => {
    return db(TABLE_NAME).where({ id }).first();
  },

  // Find user by email
  findByEmail: (email) => {
    return db(TABLE_NAME).where({ email: email.toLowerCase() }).first();
  },

  // Find user by Google ID
  findByGoogleId: (googleId) => {
    return db(TABLE_NAME).where({ google_id: googleId }).first();
  },

  // Create a new user
  create: (userData) => {
    return db(TABLE_NAME)
      .insert({
        ...userData,
        email: userData.email.toLowerCase(),
      })
      .returning('*')
      .then((rows) => rows[0]);
  },

  // Update user
  update: (id, userData) => {
    return db(TABLE_NAME)
      .where({ id })
      .update({
        ...userData,
        updated_at: db.fn.now(),
      })
      .returning('*')
      .then((rows) => rows[0]);
  },

  // Update last login timestamp
  updateLastLogin: (id) => {
    return db(TABLE_NAME)
      .where({ id })
      .update({
        last_login_at: db.fn.now(),
        updated_at: db.fn.now(),
      });
  },

  // Verify email
  verifyEmail: (id) => {
    return db(TABLE_NAME)
      .where({ id })
      .update({
        email_verified: true,
        email_verified_at: db.fn.now(),
        updated_at: db.fn.now(),
      })
      .returning('*')
      .then((rows) => rows[0]);
  },

  // Update password
  updatePassword: (id, hashedPassword) => {
    return db(TABLE_NAME)
      .where({ id })
      .update({
        password: hashedPassword,
        updated_at: db.fn.now(),
      })
      .returning('*')
      .then((rows) => rows[0]);
  },

  // Update email
  updateEmail: (id, newEmail) => {
    return db(TABLE_NAME)
      .where({ id })
      .update({
        email: newEmail.toLowerCase(),
        email_verified: true,
        email_verified_at: db.fn.now(),
        pending_email: null,
        pending_email_created_at: null,
        updated_at: db.fn.now(),
      })
      .returning('*')
      .then((rows) => rows[0]);
  },

  // Set pending email change
  setPendingEmail: (id, pendingEmail) => {
    return db(TABLE_NAME)
      .where({ id })
      .update({
        pending_email: pendingEmail.toLowerCase(),
        pending_email_created_at: db.fn.now(),
        updated_at: db.fn.now(),
      })
      .returning('*')
      .then((rows) => rows[0]);
  },

  // Clear pending email
  clearPendingEmail: (id) => {
    return db(TABLE_NAME)
      .where({ id })
      .update({
        pending_email: null,
        pending_email_created_at: null,
        updated_at: db.fn.now(),
      });
  },

  // Soft delete user
  softDelete: (id) => {
    return db(TABLE_NAME)
      .where({ id })
      .update({
        is_active: false,
        updated_at: db.fn.now(),
      });
  },

  // Search users by email or name
  search: (searchTerm, excludeUserId = null, limit = 10) => {
    let query = db(TABLE_NAME)
      .select('id', 'email', 'first_name', 'last_name', 'avatar_url')
      .where('is_active', true)
      .andWhere((builder) => {
        builder
          .whereILike('email', `%${searchTerm}%`)
          .orWhereILike('first_name', `%${searchTerm}%`)
          .orWhereILike('last_name', `%${searchTerm}%`);
      })
      .limit(limit);

    if (excludeUserId) {
      query = query.andWhereNot('id', excludeUserId);
    }

    return query;
  },

  // Check if email exists (for email change validation)
  emailExists: async (email, excludeUserId = null) => {
    let query = db(TABLE_NAME).where({ email: email.toLowerCase() });
    
    if (excludeUserId) {
      query = query.whereNot({ id: excludeUserId });
    }
    
    const user = await query.first();
    return !!user;
  },
};

module.exports = UserModel;