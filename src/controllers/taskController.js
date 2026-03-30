const sanitizeHtml = require('sanitize-html');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { db } = require('../config/db');
const { getMembership } = require('../middlewares/auth');

const listTeamTasks = catchAsync(async (req, res, next) => {
  const { teamId } = req.params;
  const membership = await getMembership(req.user.id, teamId);
  if (!membership) {
    return next(ApiError.forbidden('Not a member of this team'));
  }

  const { status, priority, assigned_to, q } = req.query;

  const query = db('tasks')
    .where({ team_id: teamId, is_active: true })
    .orderBy('created_at', 'desc');

  if (status) {
    query.andWhere('status', status);
  }
  if (priority) {
    query.andWhere('priority', priority);
  }
  if (assigned_to) {
    query.andWhere('assigned_to', assigned_to);
  }
  if (q) {
    query.andWhere((builder) => {
      builder.whereILike('title', `%${q}%`).orWhereILike('description', `%${q}%`);
    });
  }

  const tasks = await query.select('*');

  res.json({ tasks });
});

const createTask = catchAsync(async (req, res, next) => {
  const { teamId } = req.params;
  const membership = await getMembership(req.user.id, teamId);
  if (!membership) {
    return next(ApiError.forbidden('Not a member of this team'));
  }

  const description = req.body.description ? sanitizeHtml(req.body.description, { allowedTags: [], allowedAttributes: {} }) : null;

  const [task] = await db('tasks')
    .insert({
      title: req.body.title,
      description,
      team_id: teamId,
      created_by: req.user.id,
      assigned_to: req.body.assigned_to || null,
      status: req.body.status || 'todo',
      priority: req.body.priority || 'medium',
      due_date: req.body.due_date || null,
    })
    .returning('*');

  res.status(201).json({ task });
});

const getTask = catchAsync(async (req, res, next) => {
  const { taskId } = req.params;
  const task = await db('tasks').where({ id: taskId, is_active: true }).first();
  if (!task) {
    return next(ApiError.notFound('Task not found'));
  }

  const membership = await getMembership(req.user.id, task.team_id);
  if (!membership) {
    return next(ApiError.forbidden('Not a member of this team'));
  }

  res.json({ task });
});

const updateTask = catchAsync(async (req, res, next) => {
  const { taskId } = req.params;
  const task = await db('tasks').where({ id: taskId, is_active: true }).first();
  if (!task) {
    return next(ApiError.notFound('Task not found'));
  }

  const membership = await getMembership(req.user.id, task.team_id);
  if (!membership) {
    return next(ApiError.forbidden('Not a member of this team'));
  }

  const updates = {};
  if (req.body.title) updates.title = req.body.title;
  if (Object.prototype.hasOwnProperty.call(req.body, 'description')) {
    updates.description = req.body.description
      ? sanitizeHtml(req.body.description, { allowedTags: [], allowedAttributes: {} })
      : null;
  }
  if (Object.prototype.hasOwnProperty.call(req.body, 'assigned_to')) updates.assigned_to = req.body.assigned_to;
  if (req.body.status) updates.status = req.body.status;
  if (req.body.priority) updates.priority = req.body.priority;
  if (Object.prototype.hasOwnProperty.call(req.body, 'due_date')) updates.due_date = req.body.due_date;
  if (Object.prototype.hasOwnProperty.call(req.body, 'is_active')) updates.is_active = req.body.is_active;
  updates.updated_at = db.fn.now();

  if (req.body.status === 'completed') {
    updates.completed_at = db.fn.now();
  }

  const [updated] = await db('tasks')
    .where({ id: taskId })
    .update(updates)
    .returning('*');

  res.json({ task: updated });
});

const completeTask = catchAsync(async (req, res, next) => {
  const { taskId } = req.params;
  const task = await db('tasks').where({ id: taskId, is_active: true }).first();
  if (!task) {
    return next(ApiError.notFound('Task not found'));
  }

  const membership = await getMembership(req.user.id, task.team_id);
  if (!membership) {
    return next(ApiError.forbidden('Not a member of this team'));
  }

  const [updated] = await db('tasks')
    .where({ id: taskId })
    .update({
      status: 'completed',
      completed_at: db.fn.now(),
      updated_at: db.fn.now(),
    })
    .returning('*');

  res.json({ task: updated });
});

const removeTask = catchAsync(async (req, res, next) => {
  const { taskId } = req.params;
  const task = await db('tasks').where({ id: taskId, is_active: true }).first();
  if (!task) {
    return next(ApiError.notFound('Task not found'));
  }

  const membership = await getMembership(req.user.id, task.team_id);
  if (!membership) {
    return next(ApiError.forbidden('Not a member of this team'));
  }

  if (!['owner', 'admin'].includes(membership.role)) {
    return next(ApiError.forbidden('Only admins or owners can delete tasks'));
  }

  await db('tasks')
    .where({ id: taskId })
    .update({ is_active: false, updated_at: db.fn.now() });

  res.status(204).send();
});

const listMyTasks = catchAsync(async (req, res) => {
  const { status } = req.query;

  const query = db('tasks')
    .where({ assigned_to: req.user.id, is_active: true })
    .orderBy('due_date', 'asc')
    .limit(20);

  if (status) {
    query.andWhere('status', status);
  }

  const tasks = await query.select('*');

  res.json({ tasks });
});

module.exports = {
  listTeamTasks,
  createTask,
  getTask,
  updateTask,
  completeTask,
  removeTask,
  listMyTasks,
};
