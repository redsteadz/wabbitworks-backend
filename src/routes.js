const express = require('express');
const authRoutes = require('./modules/auth/auth.routes');
const teamRoutes = require('./modules/teams/team.routes');
const taskRoutes = require('./modules/tasks/task.routes');
const membershipRoutes = require('./modules/memberships/membership.routes');
const invitationRoutes = require('./modules/invitations/invitation.routes');
const teamInvitationRoutes = require('./modules/invitations/teamInvitation.routes');
const notificationRoutes = require('./modules/notifications/notification.routes');
const taskController = require('./modules/tasks/task.controller');
const taskValidation = require('./modules/tasks/task.validation');
const { validate } = require('./middleware/validation.middleware');
const { isAuthenticated, isTeamMember } = require('./middleware/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is running
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// Auth routes
router.use('/auth', authRoutes);

// Team routes
router.use('/teams', teamRoutes);

// Task routes
router.use('/tasks', taskRoutes);

// Invitation routes
router.use('/invitations', invitationRoutes);

// Notification routes
router.use('/notifications', notificationRoutes);

// Nested routes: Team members
router.use('/teams/:teamId/members', membershipRoutes);

// Nested routes: Team invitations
router.use('/teams/:teamId/invitations', teamInvitationRoutes);

// Nested routes: Team tasks
/**
 * @swagger
 * /teams/{teamId}/tasks:
 *   get:
 *     summary: Get all tasks for a team
 *     tags: [Tasks, Teams]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 */
router.get(
  '/teams/:teamId/tasks',
  isAuthenticated,
  validate(taskValidation.getByTeam),
  isTeamMember,
  taskController.getByTeam
);

module.exports = router;