const TaskModel = require('./task.model');
const membershipService = require('../memberships/membership.service');
const ApiError = require('../../utils/ApiError');
const { MEMBERSHIP_STATUS, TASK_STATUS } = require('../../utils/constants');

// Create a new task
const create = async (taskData, userId) => {
  // Verify user is a member of the team
  const membership = await membershipService.findByUserAndTeam(userId, taskData.team_id);
  if (!membership || membership.status !== MEMBERSHIP_STATUS.ACTIVE) {
    throw ApiError.forbidden('You are not a member of this team');
  }

  // If assigning to someone, verify they are a team member
  if (taskData.assigned_to) {
    const assigneeMembership = await membershipService.findByUserAndTeam(
      taskData.assigned_to,
      taskData.team_id
    );
    if (!assigneeMembership || assigneeMembership.status !== MEMBERSHIP_STATUS.ACTIVE) {
      throw ApiError.badRequest('Assignee is not a member of this team');
    }
  }

  const task = await TaskModel.create({
    ...taskData,
    created_by: userId,
  });

  return TaskModel.findByIdWithDetails(task.id);
};

// Get task by ID
const findById = async (id, userId) => {
  const task = await TaskModel.findByIdWithDetails(id);
  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  // Verify user is a member of the team
  const membership = await membershipService.findByUserAndTeam(userId, task.team_id);
  if (!membership || membership.status !== MEMBERSHIP_STATUS.ACTIVE) {
    throw ApiError.forbidden('You are not a member of this team');
  }

  return task;
};

// Get all tasks for a team
const findByTeam = async (teamId, userId, filters) => {
  // Verify user is a member of the team
  const membership = await membershipService.findByUserAndTeam(userId, teamId);
  if (!membership || membership.status !== MEMBERSHIP_STATUS.ACTIVE) {
    throw ApiError.forbidden('You are not a member of this team');
  }

  return TaskModel.findByTeam(teamId, filters);
};

// Get all tasks for current user
const findByUser = async (userId, filters) => {
  return TaskModel.findByUser(userId, filters);
};

// Get due soon tasks
const findDueSoon = async (userId, daysAhead) => {
  return TaskModel.findDueSoon(userId, daysAhead);
};

// Get overdue tasks
const findOverdue = async (userId) => {
  return TaskModel.findOverdue(userId);
};

// Update task
const update = async (id, taskData, userId) => {
  const task = await TaskModel.findById(id);
  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  // Verify user is a member of the team
  const membership = await membershipService.findByUserAndTeam(userId, task.team_id);
  if (!membership || membership.status !== MEMBERSHIP_STATUS.ACTIVE) {
    throw ApiError.forbidden('You are not a member of this team');
  }

  // If reassigning, verify new assignee is a team member
  if (taskData.assigned_to && taskData.assigned_to !== task.assigned_to) {
    const assigneeMembership = await membershipService.findByUserAndTeam(
      taskData.assigned_to,
      task.team_id
    );
    if (!assigneeMembership || assigneeMembership.status !== MEMBERSHIP_STATUS.ACTIVE) {
      throw ApiError.badRequest('Assignee is not a member of this team');
    }
  }

  await TaskModel.update(id, taskData);
  return TaskModel.findByIdWithDetails(id);
};

// Delete task
const remove = async (id, userId) => {
  const task = await TaskModel.findById(id);
  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  // Verify user is a member of the team
  const membership = await membershipService.findByUserAndTeam(userId, task.team_id);
  if (!membership || membership.status !== MEMBERSHIP_STATUS.ACTIVE) {
    throw ApiError.forbidden('You are not a member of this team');
  }

  await TaskModel.softDelete(id);
  return { message: 'Task deleted successfully' };
};

// Get task dashboard stats
const getDashboardStats = async (userId) => {
  const [allTasks, dueSoon, overdue] = await Promise.all([
    findByUser(userId, { assigned_to_me: true }),
    findDueSoon(userId, 3),
    findOverdue(userId),
  ]);

  const stats = {
    total: allTasks.length,
    todo: allTasks.filter(t => t.status === TASK_STATUS.TODO).length,
    in_progress: allTasks.filter(t => t.status === TASK_STATUS.IN_PROGRESS).length,
    review: allTasks.filter(t => t.status === TASK_STATUS.REVIEW).length,
    completed: allTasks.filter(t => t.status === TASK_STATUS.COMPLETED).length,
    due_soon: dueSoon.length,
    overdue: overdue.length,
  };

  return {
    stats,
    due_soon: dueSoon,
    overdue: overdue,
  };
};

module.exports = {
  create,
  findById,
  findByTeam,
  findByUser,
  findDueSoon,
  findOverdue,
  update,
  remove,
  getDashboardStats,
};