const notificationService = require('./notification.service');
const catchAsync = require('../../utils/catchAsync');

/**
 * Get all notifications for current user
 * @route GET /api/notifications
 */
const getAll = catchAsync(async (req, res) => {
  const result = await notificationService.getByUser(req.user.id, req.query);

  res.json({
    success: true,
    data: result,
  });
});

/**
 * Get notification by ID
 * @route GET /api/notifications/:id
 */
const getById = catchAsync(async (req, res) => {
  const notification = await notificationService.getById(req.params.id, req.user.id);

  res.json({
    success: true,
    data: { notification },
  });
});

/**
 * Get unread count
 * @route GET /api/notifications/unread/count
 */
const getUnreadCount = catchAsync(async (req, res) => {
  const result = await notificationService.getUnreadCount(req.user.id);

  res.json({
    success: true,
    data: result,
  });
});

/**
 * Mark notification as read
 * @route PUT /api/notifications/:id/read
 */
const markAsRead = catchAsync(async (req, res) => {
  const notification = await notificationService.markAsRead(req.params.id, req.user.id);

  res.json({
    success: true,
    message: 'Notification marked as read',
    data: { notification },
  });
});

/**
 * Mark all as read
 * @route PUT /api/notifications/read-all
 */
const markAllAsRead = catchAsync(async (req, res) => {
  const result = await notificationService.markAllAsRead(req.user.id);

  res.json({
    success: true,
    message: result.message,
  });
});

/**
 * Mark as unread
 * @route PUT /api/notifications/:id/unread
 */
const markAsUnread = catchAsync(async (req, res) => {
  const notification = await notificationService.markAsUnread(req.params.id, req.user.id);

  res.json({
    success: true,
    message: 'Notification marked as unread',
    data: { notification },
  });
});

/**
 * Delete notification
 * @route DELETE /api/notifications/:id
 */
const deleteNotification = catchAsync(async (req, res) => {
  const result = await notificationService.deleteNotification(req.params.id, req.user.id);

  res.json({
    success: true,
    message: result.message,
  });
});

/**
 * Delete all notifications
 * @route DELETE /api/notifications
 */
const deleteAll = catchAsync(async (req, res) => {
  const result = await notificationService.deleteAll(req.user.id);

  res.json({
    success: true,
    message: result.message,
  });
});

/**
 * Get notification preferences
 * @route GET /api/notifications/preferences
 */
const getPreferences = catchAsync(async (req, res) => {
  const preferences = await notificationService.getPreferences(req.user.id);

  res.json({
    success: true,
    data: { preferences },
  });
});

/**
 * Update notification preferences
 * @route PUT /api/notifications/preferences
 */
const updatePreferences = catchAsync(async (req, res) => {
  const preferences = await notificationService.updatePreferences(req.user.id, req.body);

  res.json({
    success: true,
    message: 'Preferences updated successfully',
    data: { preferences },
  });
});

module.exports = {
  getAll,
  getById,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  markAsUnread,
  deleteNotification,
  deleteAll,
  getPreferences,
  updatePreferences,
};