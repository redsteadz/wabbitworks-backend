const TaskModel = require('./task.model');
const membershipService = require('../memberships/membership.service');
const notificationService = require('../notifications/notification.service');
const userService = require('../users/user.service');
const ApiError = require('../../utils/ApiError');
const { MEMBERSHIP_STATUS, TASK_STATUS, NOTIFICATION_TYPE } = require('../../utils/constants');
const env = require('../../config/env');

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

  const fullTask = await TaskModel.findByIdWithDetails(task.id);

  // Send notification if assigned to someone else
  if (taskData.assigned_to && taskData.assigned_to !== userId) {
    await notificationService.create({
      userId: taskData.assigned_to,
      actorId: userId,
      type: NOTIFICATION_TYPE.TASK_ASSIGNED,
      title: `New Task: ${task.title}`,
      message: `You have been assigned a new task: ${task.title}`,
      metadata: {
        taskId: task.id,
        taskTitle: task.title,
        taskDescription: task.description,
        teamId: taskData.team_id,
        teamName: fullTask.team_name,
        priority: task.priority,
        dueDate: task.due_date,
        taskUrl: `${env.frontend.url}/tasks/${task.id}`,
      },
      actionUrl: `${env.frontend.url}/tasks/${task.id}`,
      sendEmail: true,
    });
  }

  return fullTask;
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

  // Check if assignee is changing
  const assigneeChanged = taskData.assigned_to && 
    taskData.assigned_to !== task.assigned_to;

  // If reassigning, verify new assignee is a team member
  if (assigneeChanged) {
    const assigneeMembership = await membershipService.findByUserAndTeam(
      taskData.assigned_to,
      task.team_id
    );
    if (!assigneeMembership || assigneeMembership.status !== MEMBERSHIP_STATUS.ACTIVE) {
      throw ApiError.badRequest('Assignee is not a member of this team');
    }
  }

  await TaskModel.update(id, taskData);
  const updatedTask = await TaskModel.findByIdWithDetails(id);

  // Send notification if assigned to a new person
  if (assigneeChanged && taskData.assigned_to !== userId) {
    await notificationService.create({
      userId: taskData.assigned_to,
      actorId: userId,
      type: NOTIFICATION_TYPE.TASK_ASSIGNED,
      title: `Task Assigned: ${updatedTask.title}`,
      message: `You have been assigned to task: ${updatedTask.title}`,
      metadata: {
        taskId: id,
        taskTitle: updatedTask.title,
        taskDescription: updatedTask.description,
        teamId: task.team_id,
        teamName: updatedTask.team_name,
        priority: updatedTask.priority,
        dueDate: updatedTask.due_date,
        taskUrl: `${env.frontend.url}/tasks/${id}`,
      },
      actionUrl: `${env.frontend.url}/tasks/${id}`,
      sendEmail: true,
    });
  }

  // Send notification if task was marked completed
  if (taskData.status === TASK_STATUS.COMPLETED && task.status !== TASK_STATUS.COMPLETED) {
    // Notify task creator if different from the person who completed it
    if (task.created_by !== userId) {
      await notificationService.create({
        userId: task.created_by,
        actorId: userId,
        type: NOTIFICATION_TYPE.TASK_COMPLETED,
        title: `Task Completed: ${updatedTask.title}`,
        message: `Task "${updatedTask.title}" has been marked as completed`,
        metadata: {
          taskId: id,
          taskTitle: updatedTask.title,
          teamId: task.team_id,
          teamName: updatedTask.team_name,
          taskUrl: `${env.frontend.url}/tasks/${id}`,
        },
        actionUrl: `${env.frontend.url}/tasks/${id}`,
        sendEmail: false, // In-app only for completion
      });
    }
  }

  return updatedTask;
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