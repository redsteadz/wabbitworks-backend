const taskService = require('./task.service');
const catchAsync = require('../../utils/catchAsync');

/**
 * Create a new task
 * @route POST /api/tasks
 */
const create = catchAsync(async (req, res) => {
  const task = await taskService.create(req.body, req.user.id);

  res.status(201).json({
    success: true,
    message: 'Task created successfully',
    data: { task },
  });
});

/**
 * Get all tasks for current user
 * @route GET /api/tasks
 */
const getAll = catchAsync(async (req, res) => {
  const tasks = await taskService.findByUser(req.user.id, req.query);

  res.json({
    success: true,
    data: { tasks },
  });
});

/**
 * Get task by ID
 * @route GET /api/tasks/:id
 */
const getById = catchAsync(async (req, res) => {
  const task = await taskService.findById(req.params.id, req.user.id);

  res.json({
    success: true,
    data: { task },
  });
});

/**
 * Get tasks by team
 * @route GET /api/teams/:teamId/tasks
 */
const getByTeam = catchAsync(async (req, res) => {
  const tasks = await taskService.findByTeam(
    req.params.teamId,
    req.user.id,
    req.query
  );

  res.json({
    success: true,
    data: { tasks },
  });
});

/**
 * Update task
 * @route PUT /api/tasks/:id
 */
const update = catchAsync(async (req, res) => {
  const task = await taskService.update(req.params.id, req.body, req.user.id);

  res.json({
    success: true,
    message: 'Task updated successfully',
    data: { task },
  });
});

/**
 * Delete task
 * @route DELETE /api/tasks/:id
 */
const remove = catchAsync(async (req, res) => {
  await taskService.remove(req.params.id, req.user.id);

  res.json({
    success: true,
    message: 'Task deleted successfully',
  });
});

/**
 * Get dashboard stats
 * @route GET /api/tasks/dashboard
 */
const getDashboard = catchAsync(async (req, res) => {
  const dashboard = await taskService.getDashboardStats(req.user.id);

  res.json({
    success: true,
    data: dashboard,
  });
});

/**
 * Get tasks due soon
 * @route GET /api/tasks/due-soon
 */
const getDueSoon = catchAsync(async (req, res) => {
  const daysAhead = parseInt(req.query.days, 10) || 3;
  const tasks = await taskService.findDueSoon(req.user.id, daysAhead);

  res.json({
    success: true,
    data: { tasks },
  });
});

/**
 * Get overdue tasks
 * @route GET /api/tasks/overdue
 */
const getOverdue = catchAsync(async (req, res) => {
  const tasks = await taskService.findOverdue(req.user.id);

  res.json({
    success: true,
    data: { tasks },
  });
});

module.exports = {
  create,
  getAll,
  getById,
  getByTeam,
  update,
  remove,
  getDashboard,
  getDueSoon,
  getOverdue,
};