const express = require('express');
const authRoutes = require('./modules/auth/auth.routes');
const teamRoutes = require('./modules/teams/team.routes');
const taskRoutes = require('./modules/tasks/task.routes');
const membershipRoutes = require('./modules/memberships/membership.routes');
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: API is running
 *                 timestamp:
 *                   type: string
 *                   format: date-time
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

// Nested routes: Team members
router.use('/teams/:teamId/members', membershipRoutes);

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
 *         description: Team ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [todo, in_progress, review, completed]
 *         description: Filter by status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         description: Filter by priority
 *       - in: query
 *         name: assigned_to
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by assignee
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and description
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [created_at, due_date, priority, status]
 *           default: created_at
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of team tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     tasks:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Task'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  '/teams/:teamId/tasks',
  isAuthenticated,
  validate(taskValidation.getByTeam),
  isTeamMember,
  taskController.getByTeam
);

module.exports = router;