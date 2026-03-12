const { db } = require('../../config/db');

const TABLE_NAME = 'users';

// User model for database operations
const UserModel = {
  tableName: TABLE_NAME,

  // Find user by ID
  findById: (id) => {
    return db(TABLE_NAME).where({ id, is_active: true }).first();
  },

  // Find user by email
  findByEmail: (email) => {
    return db(TABLE_NAME).where({ email: email.toLowerCase() }).first();
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
};

module.exports = UserModel;