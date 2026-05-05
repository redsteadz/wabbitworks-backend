const taskService = require('../src/modules/tasks/task.service');
const TaskModel = require('../src/modules/tasks/task.model');
const membershipService = require('../src/modules/memberships/membership.service');
const notificationService = require('../src/modules/notifications/notification.service');
const userService = require('../src/modules/users/user.service');
const ApiError = require('../src/utils/ApiError');
const { MEMBERSHIP_STATUS, TASK_STATUS, NOTIFICATION_TYPE } = require('../src/utils/constants');

// Mock dependencies
jest.mock('../../src/modules/tasks/task.model');
jest.mock('../../src/modules/memberships/membership.service');
jest.mock('../../src/modules/notifications/notification.service');
jest.mock('../../src/modules/users/user.service');

describe('Task Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a task successfully', async () => {
      const taskData = { title: 'Test Task', team_id: 1, assigned_to: 2 };
      const userId = 1;
      const membership = { status: MEMBERSHIP_STATUS.ACTIVE };
      const task = { id: 1, ...taskData, created_by: userId };
      const fullTask = { ...task, team_name: 'Test Team' };

      membershipService.findByUserAndTeam.mockResolvedValueOnce(membership); // Creator
      membershipService.findByUserAndTeam.mockResolvedValueOnce(membership); // Assignee
      TaskModel.create.mockResolvedValue(task);
      TaskModel.findByIdWithDetails.mockResolvedValue(fullTask);
      notificationService.create.mockResolvedValue();

      const result = await taskService.create(taskData, userId);

      expect(membershipService.findByUserAndTeam).toHaveBeenCalledWith(userId, taskData.team_id);
      expect(membershipService.findByUserAndTeam).toHaveBeenCalledWith(taskData.assigned_to, taskData.team_id);
      expect(TaskModel.create).toHaveBeenCalledWith({ ...taskData, created_by: userId });
      expect(TaskModel.findByIdWithDetails).toHaveBeenCalledWith(task.id);
      expect(notificationService.create).toHaveBeenCalled();
      expect(result).toEqual(fullTask);
    });

    it('should create a task without assignee', async () => {
      const taskData = { title: 'Test Task', team_id: 1 };
      const userId = 1;
      const membership = { status: MEMBERSHIP_STATUS.ACTIVE };
      const task = { id: 1, ...taskData, created_by: userId };
      const fullTask = { ...task, team_name: 'Test Team' };

      membershipService.findByUserAndTeam.mockResolvedValueOnce(membership);
      TaskModel.create.mockResolvedValue(task);
      TaskModel.findByIdWithDetails.mockResolvedValue(fullTask);

      const result = await taskService.create(taskData, userId);

      expect(membershipService.findByUserAndTeam).toHaveBeenCalledTimes(1);
      expect(notificationService.create).not.toHaveBeenCalled();
      expect(result).toEqual(fullTask);
    });

    it('should throw error if user is not a team member', async () => {
      const taskData = { title: 'Test Task', team_id: 1 };
      const userId = 1;
      membershipService.findByUserAndTeam.mockResolvedValue(null);

      await expect(taskService.create(taskData, userId)).rejects.toThrow(ApiError);
      expect(membershipService.findByUserAndTeam).toHaveBeenCalledWith(userId, taskData.team_id);
    });

    it('should throw error if user membership is inactive', async () => {
      const taskData = { title: 'Test Task', team_id: 1 };
      const userId = 1;
      const membership = { status: MEMBERSHIP_STATUS.INACTIVE };
      membershipService.findByUserAndTeam.mockResolvedValue(membership);

      await expect(taskService.create(taskData, userId)).rejects.toThrow(ApiError);
    });

    it('should throw error if assignee is not a team member', async () => {
      const taskData = { title: 'Test Task', team_id: 1, assigned_to: 2 };
      const userId = 1;
      membershipService.findByUserAndTeam.mockResolvedValueOnce({ status: MEMBERSHIP_STATUS.ACTIVE }); // Creator
      membershipService.findByUserAndTeam.mockResolvedValueOnce(null); // Assignee

      await expect(taskService.create(taskData, userId)).rejects.toThrow(ApiError);
    });
      membershipService.findByUserAndTeam.mockResolvedValueOnce(null); // Assignee

      await expect(taskService.create(taskData, userId)).rejects.toThrow(ApiError);
    });

    it('should not send notification when assigning to self', async () => {
      const taskData = { title: 'Test Task', team_id: 1, assigned_to: 1 };
      const userId = 1;
      const membership = { status: MEMBERSHIP_STATUS.ACTIVE };
      const task = { id: 1, ...taskData, created_by: userId };
      const fullTask = { ...task, team_name: 'Test Team' };

      membershipService.findByUserAndTeam.mockResolvedValue(membership);
      TaskModel.create.mockResolvedValue(task);
      TaskModel.findByIdWithDetails.mockResolvedValue(fullTask);

      await taskService.create(taskData, userId);

      expect(notificationService.create).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return task if user is team member', async () => {
      const taskId = 1;
      const userId = 1;
      const task = { id: taskId, team_id: 1, title: 'Test Task' };
      const membership = { status: MEMBERSHIP_STATUS.ACTIVE };

      TaskModel.findByIdWithDetails.mockResolvedValue(task);
      membershipService.findByUserAndTeam.mockResolvedValue(membership);

      const result = await taskService.findById(taskId, userId);

      expect(TaskModel.findByIdWithDetails).toHaveBeenCalledWith(taskId);
      expect(membershipService.findByUserAndTeam).toHaveBeenCalledWith(userId, task.team_id);
      expect(result).toEqual(task);
    });

    it('should throw error if task not found', async () => {
      const taskId = 1;
      const userId = 1;
      TaskModel.findByIdWithDetails.mockResolvedValue(null);

      await expect(taskService.findById(taskId, userId)).rejects.toThrow(ApiError);
    });

    it('should throw error if user is not team member', async () => {
      const taskId = 1;
      const userId = 1;
      const task = { id: taskId, team_id: 1, title: 'Test Task' };
      TaskModel.findByIdWithDetails.mockResolvedValue(task);
      membershipService.findByUserAndTeam.mockResolvedValue(null);

      await expect(taskService.findById(taskId, userId)).rejects.toThrow(ApiError);
    });
  });

  describe('findByTeam', () => {
    it('should return tasks for team if user is member', async () => {
      const teamId = 1;
      const userId = 1;
      const filters = { status: 'todo' };
      const tasks = [{ id: 1, title: 'Task 1' }];
      const membership = { status: MEMBERSHIP_STATUS.ACTIVE };

      membershipService.findByUserAndTeam.mockResolvedValue(membership);
      TaskModel.findByTeam.mockResolvedValue(tasks);

      const result = await taskService.findByTeam(teamId, userId, filters);

      expect(membershipService.findByUserAndTeam).toHaveBeenCalledWith(userId, teamId);
      expect(TaskModel.findByTeam).toHaveBeenCalledWith(teamId, filters);
      expect(result).toEqual(tasks);
    });

    it('should throw error if user is not team member', async () => {
      const teamId = 1;
      const userId = 1;
      membershipService.findByUserAndTeam.mockResolvedValue(null);

      await expect(taskService.findByTeam(teamId, userId)).rejects.toThrow(ApiError);
    });
  });

  describe('findByUser', () => {
    it('should return tasks for user', async () => {
      const userId = 1;
      const filters = { status: 'todo' };
      const tasks = [{ id: 1, title: 'Task 1' }];

      TaskModel.findByUser.mockResolvedValue(tasks);

      const result = await taskService.findByUser(userId, filters);

      expect(TaskModel.findByUser).toHaveBeenCalledWith(userId, filters);
      expect(result).toEqual(tasks);
    });
  });

  describe('findDueSoon', () => {
    it('should return due soon tasks', async () => {
      const userId = 1;
      const daysAhead = 3;
      const tasks = [{ id: 1, title: 'Due Soon Task' }];

      TaskModel.findDueSoon.mockResolvedValue(tasks);

      const result = await taskService.findDueSoon(userId, daysAhead);

      expect(TaskModel.findDueSoon).toHaveBeenCalledWith(userId, daysAhead);
      expect(result).toEqual(tasks);
    });
  });

  describe('findOverdue', () => {
    it('should return overdue tasks', async () => {
      const userId = 1;
      const tasks = [{ id: 1, title: 'Overdue Task' }];

      TaskModel.findOverdue.mockResolvedValue(tasks);

      const result = await taskService.findOverdue(userId);

      expect(TaskModel.findOverdue).toHaveBeenCalledWith(userId);
      expect(result).toEqual(tasks);
    });
  });

  describe('update', () => {
    it('should update task successfully', async () => {
      const taskId = 1;
      const taskData = { title: 'Updated Task', status: TASK_STATUS.COMPLETED };
      const userId = 1;
      const task = { id: taskId, team_id: 1, title: 'Original Task', status: TASK_STATUS.TODO, created_by: 2 };
      const updatedTask = { ...task, ...taskData };
      const membership = { status: MEMBERSHIP_STATUS.ACTIVE };

      TaskModel.findById.mockResolvedValue(task);
      membershipService.findByUserAndTeam.mockResolvedValue(membership);
      TaskModel.update.mockResolvedValue();
      TaskModel.findByIdWithDetails.mockResolvedValue(updatedTask);
      notificationService.create.mockResolvedValue();

      const result = await taskService.update(taskId, taskData, userId);

      expect(TaskModel.findById).toHaveBeenCalledWith(taskId);
      expect(membershipService.findByUserAndTeam).toHaveBeenCalledWith(userId, task.team_id);
      expect(TaskModel.update).toHaveBeenCalledWith(taskId, taskData);
      expect(notificationService.create).toHaveBeenCalled();
      expect(result).toEqual(updatedTask);
    });

    it('should send completion notification to creator', async () => {
      const taskId = 1;
      const taskData = { status: TASK_STATUS.COMPLETED };
      const userId = 1;
      const task = { id: taskId, team_id: 1, title: 'Task', status: TASK_STATUS.TODO, created_by: 2 };
      const updatedTask = { ...task, ...taskData };
      const membership = { status: MEMBERSHIP_STATUS.ACTIVE };

      TaskModel.findById.mockResolvedValue(task);
      membershipService.findByUserAndTeam.mockResolvedValue(membership);
      TaskModel.update.mockResolvedValue();
      TaskModel.findByIdWithDetails.mockResolvedValue(updatedTask);
      notificationService.create.mockResolvedValue();

      await taskService.update(taskId, taskData, userId);

      expect(notificationService.create).toHaveBeenCalledWith({
        userId: task.created_by,
        actorId: userId,
        type: NOTIFICATION_TYPE.TASK_COMPLETED,
        title: `Task Completed: ${updatedTask.title}`,
        message: `Task "${updatedTask.title}" has been marked as completed`,
        metadata: expect.any(Object),
        actionUrl: expect.any(String),
        sendEmail: false,
      });
    });

    it('should not send completion notification if completer is creator', async () => {
      const taskId = 1;
      const taskData = { status: TASK_STATUS.COMPLETED };
      const userId = 1;
      const task = { id: taskId, team_id: 1, title: 'Task', status: TASK_STATUS.TODO, created_by: userId };
      const updatedTask = { ...task, ...taskData };
      const membership = { status: MEMBERSHIP_STATUS.ACTIVE };

      TaskModel.findById.mockResolvedValue(task);
      membershipService.findByUserAndTeam.mockResolvedValue(membership);
      TaskModel.update.mockResolvedValue();
      TaskModel.findByIdWithDetails.mockResolvedValue(updatedTask);

      await taskService.update(taskId, taskData, userId);

      expect(notificationService.create).not.toHaveBeenCalled();
    });

    it('should send assignment notification when assignee changes', async () => {
      const taskId = 1;
      const taskData = { assigned_to: 3 };
      const userId = 1;
      const task = { id: taskId, team_id: 1, title: 'Task', assigned_to: 2 };
      const updatedTask = { ...task, ...taskData };
      const membership = { status: MEMBERSHIP_STATUS.ACTIVE };

      TaskModel.findById.mockResolvedValue(task);
      membershipService.findByUserAndTeam.mockResolvedValueOnce(membership); // User membership
      membershipService.findByUserAndTeam.mockResolvedValueOnce(membership); // New assignee membership
      TaskModel.update.mockResolvedValue();
      TaskModel.findByIdWithDetails.mockResolvedValue(updatedTask);
      notificationService.create.mockResolvedValue();

      await taskService.update(taskId, taskData, userId);

      expect(notificationService.create).toHaveBeenCalledWith({
        userId: taskData.assigned_to,
        actorId: userId,
        type: NOTIFICATION_TYPE.TASK_ASSIGNED,
        title: `Task Assigned: ${updatedTask.title}`,
        message: `You have been assigned to task: ${updatedTask.title}`,
        metadata: expect.any(Object),
        actionUrl: expect.any(String),
        sendEmail: true,
      });
    });

    it('should throw error if task not found', async () => {
      const taskId = 1;
      const taskData = { title: 'Updated Task' };
      const userId = 1;
      TaskModel.findById.mockResolvedValue(null);

      await expect(taskService.update(taskId, taskData, userId)).rejects.toThrow(ApiError);
    });

    it('should throw error if user is not team member', async () => {
      const taskId = 1;
      const taskData = { title: 'Updated Task' };
      const userId = 1;
      const task = { id: taskId, team_id: 1 };
      TaskModel.findById.mockResolvedValue(task);
      membershipService.findByUserAndTeam.mockResolvedValue(null);

      await expect(taskService.update(taskId, taskData, userId)).rejects.toThrow(ApiError);
    });

    it('should throw error if new assignee is not team member', async () => {
      const taskId = 1;
      const taskData = { assigned_to: 3 };
      const userId = 1;
      const task = { id: taskId, team_id: 1, assigned_to: 2 };
      const membership = { status: MEMBERSHIP_STATUS.ACTIVE };

      TaskModel.findById.mockResolvedValue(task);
      membershipService.findByUserAndTeam.mockResolvedValueOnce(membership); // User membership
      membershipService.findByUserAndTeam.mockResolvedValueOnce(null); // New assignee membership

      await expect(taskService.update(taskId, taskData, userId)).rejects.toThrow(ApiError);
    });
  });

  describe('remove', () => {
    it('should delete task successfully', async () => {
      const taskId = 1;
      const userId = 1;
      const task = { id: taskId, team_id: 1 };
      const membership = { status: MEMBERSHIP_STATUS.ACTIVE };

      TaskModel.findById.mockResolvedValue(task);
      membershipService.findByUserAndTeam.mockResolvedValue(membership);
      TaskModel.softDelete.mockResolvedValue();

      const result = await taskService.remove(taskId, userId);

      expect(TaskModel.findById).toHaveBeenCalledWith(taskId);
      expect(membershipService.findByUserAndTeam).toHaveBeenCalledWith(userId, task.team_id);
      expect(TaskModel.softDelete).toHaveBeenCalledWith(taskId);
      expect(result).toEqual({ message: 'Task deleted successfully' });
    });

    it('should throw error if task not found', async () => {
      const taskId = 1;
      const userId = 1;
      TaskModel.findById.mockResolvedValue(null);

      await expect(taskService.remove(taskId, userId)).rejects.toThrow(ApiError);
    });

    it('should throw error if user is not team member', async () => {
      const taskId = 1;
      const userId = 1;
      const task = { id: taskId, team_id: 1 };
      TaskModel.findById.mockResolvedValue(task);
      membershipService.findByUserAndTeam.mockResolvedValue(null);

      await expect(taskService.remove(taskId, userId)).rejects.toThrow(ApiError);
    });
  });

  describe('getDashboardStats', () => {
    it('should return dashboard stats', async () => {
      const userId = 1;
      const tasks = [
        { status: TASK_STATUS.TODO },
        { status: TASK_STATUS.IN_PROGRESS },
        { status: TASK_STATUS.REVIEW },
        { status: TASK_STATUS.COMPLETED },
      ];
      const dueSoon = [{ id: 1 }];
      const overdue = [{ id: 2 }];

      TaskModel.findByUser.mockResolvedValue(tasks);
      TaskModel.findDueSoon.mockResolvedValue(dueSoon);
      TaskModel.findOverdue.mockResolvedValue(overdue);

      const result = await taskService.getDashboardStats(userId);

      expect(result.stats).toEqual({
        total: 4,
        todo: 1,
        in_progress: 1,
        review: 1,
        completed: 1,
        due_soon: 1,
        overdue: 1,
      });
      expect(result.due_soon).toEqual(dueSoon);
      expect(result.overdue).toEqual(overdue);
    });
  });
});