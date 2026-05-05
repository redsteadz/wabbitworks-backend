const notificationService = require('../src/modules/notifications/notification.service');
const NotificationModel = require('../src/modules/notifications/notification.model');
const NotificationPreferencesModel = require('../src/modules/notifications/notificationPreferences.model');
const emailService = require('../src/services/email.service');
const userService = require('../src/modules/users/user.service');
const ApiError = require('../src/utils/ApiError');
const { NOTIFICATION_TYPE } = require('../src/utils/constants');

// Mock dependencies
jest.mock('../../src/modules/notifications/notification.model');
jest.mock('../../src/modules/notifications/notificationPreferences.model');
jest.mock('../../src/services/email.service');
jest.mock('../../src/modules/users/user.service');

describe('Notification Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create notification with in-app and email', async () => {
      const notificationData = {
        userId: 1,
        actorId: 2,
        type: NOTIFICATION_TYPE.TASK_ASSIGNED,
        title: 'Task Assigned',
        message: 'You have been assigned a task',
        metadata: { taskId: 1 },
        actionUrl: 'http://example.com/tasks/1',
        sendEmail: true,
      };
      const createdNotification = { id: 1, ...notificationData };

      NotificationPreferencesModel.isInAppEnabled.mockResolvedValue(true);
      NotificationModel.create.mockResolvedValue(createdNotification);
      NotificationPreferencesModel.isEmailEnabled.mockResolvedValue(true);
      userService.findById.mockResolvedValue({ id: 1, first_name: 'John', last_name: 'Doe', email: 'john@example.com' });
      userService.findById.mockResolvedValue({ id: 2, first_name: 'Jane', last_name: 'Smith' });
      emailService.sendTaskAssignedEmail.mockResolvedValue();
      NotificationModel.markEmailSent.mockResolvedValue();

      const result = await notificationService.create(notificationData);

      expect(NotificationModel.create).toHaveBeenCalled();
      expect(emailService.sendTaskAssignedEmail).toHaveBeenCalled();
      expect(NotificationModel.markEmailSent).toHaveBeenCalledWith(createdNotification.id);
      expect(result).toEqual(createdNotification);
    });

    it('should create notification with in-app only', async () => {
      const notificationData = {
        userId: 1,
        actorId: 2,
        type: NOTIFICATION_TYPE.TASK_ASSIGNED,
        title: 'Task Assigned',
        message: 'You have been assigned a task',
        sendEmail: false,
      };
      const createdNotification = { id: 1, ...notificationData };

      NotificationPreferencesModel.isInAppEnabled.mockResolvedValue(true);
      NotificationModel.create.mockResolvedValue(createdNotification);

      const result = await notificationService.create(notificationData);

      expect(NotificationModel.create).toHaveBeenCalled();
      expect(emailService.sendTaskAssignedEmail).not.toHaveBeenCalled();
      expect(result).toEqual(createdNotification);
    });

    it('should skip in-app notification if disabled', async () => {
      const notificationData = {
        userId: 1,
        type: NOTIFICATION_TYPE.TASK_ASSIGNED,
        title: 'Task Assigned',
        message: 'You have been assigned a task',
        sendEmail: false,
      };

      NotificationPreferencesModel.isInAppEnabled.mockResolvedValue(false);

      const result = await notificationService.create(notificationData);

      expect(NotificationModel.create).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should handle email sending failure gracefully', async () => {
      const notificationData = {
        userId: 1,
        actorId: 2,
        type: NOTIFICATION_TYPE.TASK_ASSIGNED,
        title: 'Task Assigned',
        message: 'You have been assigned a task',
        sendEmail: true,
      };
      const createdNotification = { id: 1, ...notificationData };

      NotificationPreferencesModel.isInAppEnabled.mockResolvedValue(true);
      NotificationModel.create.mockResolvedValue(createdNotification);
      NotificationPreferencesModel.isEmailEnabled.mockResolvedValue(true);
      emailService.sendTaskAssignedEmail.mockRejectedValue(new Error('Email failed'));

      const result = await notificationService.create(notificationData);

      expect(result).toEqual(createdNotification); // Should still return notification
    });
  });

  describe('sendNotificationEmail', () => {
    it('should send team invitation email', async () => {
      const notificationData = {
        userId: 1,
        actorId: 2,
        type: NOTIFICATION_TYPE.TEAM_INVITATION,
        metadata: {
          teamName: 'Test Team',
          role: 'member',
          message: 'Welcome!',
          acceptUrl: 'http://example.com/accept',
          declineUrl: 'http://example.com/decline',
          viewUrl: 'http://example.com/view',
          expiresAt: '2024-01-01',
        },
      };

      userService.findById.mockResolvedValueOnce({ id: 1, first_name: 'John', last_name: 'Doe', email: 'john@example.com' });
      userService.findById.mockResolvedValueOnce({ id: 2, first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com' });
      emailService.sendTeamInvitationEmail.mockResolvedValue();

      await notificationService.sendNotificationEmail(notificationData);

      expect(emailService.sendTeamInvitationEmail).toHaveBeenCalledWith({
        to: 'john@example.com',
        invitedUserName: 'John Doe',
        inviterName: 'Jane Smith',
        inviterEmail: 'jane@example.com',
        teamName: 'Test Team',
        role: 'member',
        message: 'Welcome!',
        acceptUrl: 'http://example.com/accept',
        declineUrl: 'http://example.com/decline',
        viewUrl: 'http://example.com/view',
        expiresAt: '2024-01-01',
      });
    });

    it('should send invitation accepted email', async () => {
      const notificationData = {
        userId: 1,
        actorId: 2,
        type: NOTIFICATION_TYPE.INVITATION_ACCEPTED,
        metadata: {
          teamName: 'Test Team',
          role: 'member',
          teamUrl: 'http://example.com/team',
        },
      };

      userService.findById.mockResolvedValueOnce({ id: 1, first_name: 'John', last_name: 'Doe', email: 'john@example.com' });
      userService.findById.mockResolvedValueOnce({ id: 2, first_name: 'Jane', last_name: 'Smith' });
      emailService.sendInvitationAcceptedEmail.mockResolvedValue();

      await notificationService.sendNotificationEmail(notificationData);

      expect(emailService.sendInvitationAcceptedEmail).toHaveBeenCalled();
    });

    it('should skip email for unknown notification type', async () => {
      const notificationData = {
        userId: 1,
        type: 'unknown_type',
      };

      userService.findById.mockResolvedValue({ id: 1, email: 'john@example.com' });

      await notificationService.sendNotificationEmail(notificationData);

      expect(emailService.sendTeamInvitationEmail).not.toHaveBeenCalled();
    });
  });

  describe('getByUser', () => {
    it('should return notifications with pagination', async () => {
      const userId = 1;
      const filters = { page: 1, limit: 10 };
      const notifications = [
        { id: 1, metadata: '{"taskId": 1}' },
        { id: 2, metadata: null },
      ];
      const totalCount = 2;
      const unreadCount = 1;

      NotificationModel.findByUser.mockResolvedValue(notifications);
      NotificationModel.countByUser.mockResolvedValue(totalCount);
      NotificationModel.countUnread.mockResolvedValue(unreadCount);

      const result = await notificationService.getByUser(userId, filters);

      expect(result.notifications[0].metadata).toEqual({ taskId: 1 });
      expect(result.notifications[1].metadata).toBeNull();
      expect(result.pagination).toEqual({
        total: totalCount,
        unread: unreadCount,
        page: 1,
        limit: 10,
      });
    });
  });

  describe('getById', () => {
    it('should return notification if user owns it', async () => {
      const id = 1;
      const userId = 1;
      const notification = { id, user_id: userId, metadata: '{"taskId": 1}' };

      NotificationModel.findById.mockResolvedValue(notification);

      const result = await notificationService.getById(id, userId);

      expect(result.metadata).toEqual({ taskId: 1 });
    });

    it('should throw error if notification not found', async () => {
      const id = 1;
      const userId = 1;

      NotificationModel.findById.mockResolvedValue(null);

      await expect(notificationService.getById(id, userId)).rejects.toThrow(ApiError);
    });

    it('should throw error if user does not own notification', async () => {
      const id = 1;
      const userId = 1;
      const notification = { id, user_id: 2 };

      NotificationModel.findById.mockResolvedValue(notification);

      await expect(notificationService.getById(id, userId)).rejects.toThrow(ApiError);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const id = 1;
      const userId = 1;
      const notification = { id, user_id: userId };

      NotificationModel.findById.mockResolvedValue(notification);
      NotificationModel.markAsRead.mockResolvedValue();

      const result = await notificationService.markAsRead(id, userId);

      expect(NotificationModel.markAsRead).toHaveBeenCalledWith(id);
    });

    it('should throw error if user does not own notification', async () => {
      const id = 1;
      const userId = 1;
      const notification = { id, user_id: 2 };

      NotificationModel.findById.mockResolvedValue(notification);

      await expect(notificationService.markAsRead(id, userId)).rejects.toThrow(ApiError);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      const userId = 1;

      NotificationModel.markAllAsRead.mockResolvedValue();

      const result = await notificationService.markAllAsRead(userId);

      expect(NotificationModel.markAllAsRead).toHaveBeenCalledWith(userId);
      expect(result).toEqual({ message: 'All notifications marked as read' });
    });
  });

  describe('markAsUnread', () => {
    it('should mark notification as unread', async () => {
      const id = 1;
      const userId = 1;
      const notification = { id, user_id: userId };

      NotificationModel.findById.mockResolvedValue(notification);
      NotificationModel.markAsUnread.mockResolvedValue();

      const result = await notificationService.markAsUnread(id, userId);

      expect(NotificationModel.markAsUnread).toHaveBeenCalledWith(id);
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification', async () => {
      const id = 1;
      const userId = 1;
      const notification = { id, user_id: userId };

      NotificationModel.findById.mockResolvedValue(notification);
      NotificationModel.delete.mockResolvedValue();

      const result = await notificationService.deleteNotification(id, userId);

      expect(NotificationModel.delete).toHaveBeenCalledWith(id);
      expect(result).toEqual({ message: 'Notification deleted successfully' });
    });
  });

  describe('deleteAll', () => {
    it('should delete all notifications for user', async () => {
      const userId = 1;

      NotificationModel.deleteByUser.mockResolvedValue();

      const result = await notificationService.deleteAll(userId);

      expect(NotificationModel.deleteByUser).toHaveBeenCalledWith(userId);
      expect(result).toEqual({ message: 'All notifications deleted successfully' });
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      const userId = 1;
      const count = 5;

      NotificationModel.countUnread.mockResolvedValue(count);

      const result = await notificationService.getUnreadCount(userId);

      expect(result).toEqual({ count });
    });
  });

  describe('getPreferences', () => {
    it('should return notification preferences', async () => {
      const userId = 1;
      const preferences = { user_id: userId, email_enabled: true };

      NotificationPreferencesModel.getOrCreate.mockResolvedValue(preferences);

      const result = await notificationService.getPreferences(userId);

      expect(result).toEqual(preferences);
    });
  });

  describe('updatePreferences', () => {
    it('should update notification preferences', async () => {
      const userId = 1;
      const preferencesData = { email_enabled: false };
      const updatedPreferences = { user_id: userId, ...preferencesData };

      NotificationPreferencesModel.getOrCreate.mockResolvedValue({ user_id: userId });
      NotificationPreferencesModel.update.mockResolvedValue(updatedPreferences);

      const result = await notificationService.updatePreferences(userId, preferencesData);

      expect(NotificationPreferencesModel.update).toHaveBeenCalledWith(userId, preferencesData);
      expect(result).toEqual(updatedPreferences);
    });
  });
});