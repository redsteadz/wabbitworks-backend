const NotificationModel = require('./notification.model');
const NotificationPreferencesModel = require('./notificationPreferences.model');
const emailService = require('../../services/email.service');
const userService = require('../users/user.service');
const ApiError = require('../../utils/ApiError');
const { NOTIFICATION_TYPE } = require('../../utils/constants');
const env = require('../../config/env');

/**
 * Create a notification
 * @param {object} notificationData - Notification data
 * @param {string} notificationData.userId - Recipient user ID
 * @param {string} notificationData.actorId - Actor user ID (who performed the action)
 * @param {string} notificationData.type - Notification type
 * @param {string} notificationData.title - Notification title
 * @param {string} notificationData.message - Notification message
 * @param {object} notificationData.metadata - Additional metadata
 * @param {string} notificationData.actionUrl - Action URL
 * @param {boolean} notificationData.sendEmail - Whether to send email
 */
const create = async (notificationData) => {
  const { userId, actorId, type, title, message, metadata, actionUrl, sendEmail = true } = notificationData;

  // Check if in-app notification is enabled
  const inAppEnabled = await NotificationPreferencesModel.isInAppEnabled(userId, type);
  
  let notification = null;

  if (inAppEnabled) {
    // Create in-app notification
    notification = await NotificationModel.create({
      user_id: userId,
      actor_id: actorId,
      type,
      title,
      message,
      metadata: metadata ? JSON.stringify(metadata) : null,
      action_url: actionUrl,
    });
  }

  // Check if email notification is enabled
  if (sendEmail) {
    const emailEnabled = await NotificationPreferencesModel.isEmailEnabled(userId, type);
    
    if (emailEnabled) {
      try {
        await sendNotificationEmail(notificationData);
        
        if (notification) {
          await NotificationModel.markEmailSent(notification.id);
        }
      } catch (error) {
        console.error('Failed to send notification email:', error);
        // Don't throw - notification still created even if email fails
      }
    }
  }

  return notification;
};

/**
 * Send notification email based on type
 */
const sendNotificationEmail = async (notificationData) => {
  const { userId, actorId, type, metadata } = notificationData;

  const user = await userService.findById(userId);
  if (!user) return;

  const actor = actorId ? await userService.findById(actorId) : null;

  switch (type) {
    case NOTIFICATION_TYPE.TEAM_INVITATION:
      await emailService.sendTeamInvitationEmail({
        to: user.email,
        invitedUserName: `${user.first_name} ${user.last_name}`,
        inviterName: actor ? `${actor.first_name} ${actor.last_name}` : 'Someone',
        inviterEmail: actor ? actor.email : '',
        teamName: metadata.teamName,
        role: metadata.role,
        message: metadata.message,
        acceptUrl: metadata.acceptUrl,
        declineUrl: metadata.declineUrl,
        viewUrl: metadata.viewUrl,
        expiresAt: metadata.expiresAt,
      });
      break;

    case NOTIFICATION_TYPE.INVITATION_ACCEPTED:
      await emailService.sendInvitationAcceptedEmail({
        to: user.email,
        inviterName: `${user.first_name} ${user.last_name}`,
        acceptedUserName: actor ? `${actor.first_name} ${actor.last_name}` : 'Someone',
        teamName: metadata.teamName,
        role: metadata.role,
        teamUrl: metadata.teamUrl,
      });
      break;

    case NOTIFICATION_TYPE.INVITATION_DECLINED:
      await emailService.sendInvitationDeclinedEmail({
        to: user.email,
        inviterName: `${user.first_name} ${user.last_name}`,
        declinedUserName: actor ? `${actor.first_name} ${actor.last_name}` : 'Someone',
        teamName: metadata.teamName,
        role: metadata.role,
        teamUrl: metadata.teamUrl,
      });
      break;

    case NOTIFICATION_TYPE.TASK_ASSIGNED:
      await emailService.sendTaskAssignedEmail({
        to: user.email,
        assigneeName: `${user.first_name} ${user.last_name}`,
        assignerName: actor ? `${actor.first_name} ${actor.last_name}` : 'Someone',
        taskTitle: metadata.taskTitle,
        taskDescription: metadata.taskDescription,
        teamName: metadata.teamName,
        priority: metadata.priority,
        dueDate: metadata.dueDate,
        taskUrl: metadata.taskUrl,
      });
      break;

    default:
      // For other notification types, skip email
      break;
  }
};

/**
 * Get all notifications for a user
 */
const getByUser = async (userId, filters) => {
  const notifications = await NotificationModel.findByUser(userId, filters);
  const totalCount = await NotificationModel.countByUser(userId, filters);
  const unreadCount = await NotificationModel.countUnread(userId);

  // Parse metadata from JSON
  const parsedNotifications = notifications.map(notification => ({
    ...notification,
    metadata:
      notification.metadata
        ? typeof notification.metadata === "string"
          ? JSON.parse(notification.metadata)
          : notification.metadata
        : null,
  }));

  return {
    notifications: parsedNotifications,
    pagination: {
      total: totalCount,
      unread: unreadCount,
      page: parseInt(filters.page, 10) || 1,
      limit: parseInt(filters.limit, 10) || 20,
    },
  };
};

/**
 * Get notification by ID
 */
const getById = async (id, userId) => {
  const notification = await NotificationModel.findById(id);

  if (!notification) {
    throw ApiError.notFound('Notification not found');
  }

  if (notification.user_id !== userId) {
    throw ApiError.forbidden('You do not have access to this notification');
  }

  return {
    ...notification,
    metadata: notification.metadata ? JSON.parse(notification.metadata) : null,
  };
};

/**
 * Mark notification as read
 */
const markAsRead = async (id, userId) => {
  const notification = await NotificationModel.findById(id);

  if (!notification) {
    throw ApiError.notFound('Notification not found');
  }

  if (notification.user_id !== userId) {
    throw ApiError.forbidden('You do not have access to this notification');
  }

  return NotificationModel.markAsRead(id);
};

/**
 * Mark all as read
 */
const markAllAsRead = async (userId) => {
  await NotificationModel.markAllAsRead(userId);
  return { message: 'All notifications marked as read' };
};

/**
 * Mark as unread
 */
const markAsUnread = async (id, userId) => {
  const notification = await NotificationModel.findById(id);

  if (!notification) {
    throw ApiError.notFound('Notification not found');
  }

  if (notification.user_id !== userId) {
    throw ApiError.forbidden('You do not have access to this notification');
  }

  return NotificationModel.markAsUnread(id);
};

/**
 * Delete notification
 */
const deleteNotification = async (id, userId) => {
  const notification = await NotificationModel.findById(id);

  if (!notification) {
    throw ApiError.notFound('Notification not found');
  }

  if (notification.user_id !== userId) {
    throw ApiError.forbidden('You do not have access to this notification');
  }

  await NotificationModel.delete(id);
  return { message: 'Notification deleted successfully' };
};

/**
 * Delete all notifications for user
 */
const deleteAll = async (userId) => {
  await NotificationModel.deleteByUser(userId);
  return { message: 'All notifications deleted successfully' };
};

/**
 * Get unread count
 */
const getUnreadCount = async (userId) => {
  const count = await NotificationModel.countUnread(userId);
  return { count };
};

/**
 * Get or create notification preferences
 */
const getPreferences = async (userId) => {
  return NotificationPreferencesModel.getOrCreate(userId);
};

/**
 * Update notification preferences
 */
const updatePreferences = async (userId, preferencesData) => {
  // Ensure preferences exist
  await NotificationPreferencesModel.getOrCreate(userId);

  return NotificationPreferencesModel.update(userId, preferencesData);
};

module.exports = {
  create,
  getByUser,
  getById,
  markAsRead,
  markAllAsRead,
  markAsUnread,
  deleteNotification,
  deleteAll,
  getUnreadCount,
  getPreferences,
  updatePreferences,
};