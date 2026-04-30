const express = require('express');
const notificationController = require('./notification.controller');
const notificationValidation = require('./notification.validation');
const { validate } = require('../../middleware/validation.middleware');
const { isAuthenticated } = require('../../middleware/auth.middleware');

const router = express.Router();

// All routes require authentication
router.use(isAuthenticated);

/**
 * @swagger
 * /notifications/unread/count:
 *   get:
 *     summary: Get unread notification count
 *     tags: [Notifications]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Unread count
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/unread/count', notificationController.getUnreadCount);

/**
 * @swagger
 * /notifications/read-all:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put('/read-all', notificationController.markAllAsRead);

/**
 * @swagger
 * /notifications/preferences:
 *   get:
 *     summary: Get notification preferences
 *     tags: [Notifications]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Notification preferences
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/preferences', notificationController.getPreferences);

/**
 * @swagger
 * /notifications/preferences:
 *   put:
 *     summary: Update notification preferences
 *     tags: [Notifications]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email_team_invitation:
 *                 type: boolean
 *               email_task_assigned:
 *                 type: boolean
 *               inapp_team_invitation:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Preferences updated
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put(
  '/preferences',
  validate(notificationValidation.updatePreferences),
  notificationController.updatePreferences
);

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get all notifications for current user
 *     tags: [Notifications]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: is_read
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of notifications
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  '/',
  validate(notificationValidation.getAll),
  notificationController.getAll
);

/**
 * @swagger
 * /notifications:
 *   delete:
 *     summary: Delete all notifications
 *     tags: [Notifications]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: All notifications deleted
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.delete('/', notificationController.deleteAll);

/**
 * @swagger
 * /notifications/{id}:
 *   get:
 *     summary: Get notification by ID
 *     tags: [Notifications]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Notification details
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  '/:id',
  validate(notificationValidation.getById),
  notificationController.getById
);

/**
 * @swagger
 * /notifications/{id}/read:
 *   put:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put(
  '/:id/read',
  validate(notificationValidation.getById),
  notificationController.markAsRead
);

/**
 * @swagger
 * /notifications/{id}/unread:
 *   put:
 *     summary: Mark notification as unread
 *     tags: [Notifications]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Notification marked as unread
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put(
  '/:id/unread',
  validate(notificationValidation.getById),
  notificationController.markAsUnread
);

/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     summary: Delete notification
 *     tags: [Notifications]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Notification deleted
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete(
  '/:id',
  validate(notificationValidation.getById),
  notificationController.deleteNotification
);

module.exports = router;