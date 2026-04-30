const { db } = require('../../config/db');

const TABLE_NAME = 'notification_preferences';

const NotificationPreferencesModel = {
  tableName: TABLE_NAME,

  /**
   * Find preferences by user ID
   */
  findByUser: async (userId) => {
    return db(TABLE_NAME).where({ user_id: userId }).first();
  },

  /**
   * Create default preferences for user
   */
  create: async (userId) => {
    const [preferences] = await db(TABLE_NAME)
      .insert({ user_id: userId })
      .returning('*');
    return preferences;
  },

  /**
   * Update preferences
   */
  update: async (userId, preferencesData) => {
    const [preferences] = await db(TABLE_NAME)
      .where({ user_id: userId })
      .update({
        ...preferencesData,
        updated_at: db.fn.now(),
      })
      .returning('*');
    return preferences;
  },

  /**
   * Get or create preferences
   */
  getOrCreate: async (userId) => {
    let preferences = await NotificationPreferencesModel.findByUser(userId);
    
    if (!preferences) {
      preferences = await NotificationPreferencesModel.create(userId);
    }
    
    return preferences;
  },

  /**
   * Check if email notification is enabled for a type
   */
  isEmailEnabled: async (userId, notificationType) => {
    const preferences = await NotificationPreferencesModel.getOrCreate(userId);
    const fieldName = `email_${notificationType}`;
    return preferences[fieldName] !== false; // Default to true if not set
  },

  /**
   * Check if in-app notification is enabled for a type
   */
  isInAppEnabled: async (userId, notificationType) => {
    const preferences = await NotificationPreferencesModel.getOrCreate(userId);
    const fieldName = `inapp_${notificationType}`;
    return preferences[fieldName] !== false; // Default to true if not set
  },
};

module.exports = NotificationPreferencesModel;