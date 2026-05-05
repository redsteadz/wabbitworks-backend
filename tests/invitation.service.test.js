const invitationService = require('../src/modules/invitations/invitation.service');
const InvitationModel = require('../src/modules/invitations/invitation.model');
const MembershipModel = require('../src/modules/memberships/membership.model');
const userService = require('../src/modules/users/user.service');
const membershipService = require('../src/modules/memberships/membership.service');
const notificationService = require('../src/modules/notifications/notification.service');
const TeamModel = require('../src/modules/teams/team.model');
const ApiError = require('../src/utils/ApiError');
const {
  MEMBERSHIP_ROLE,
  MEMBERSHIP_STATUS,
  INVITATION_STATUS,
  NOTIFICATION_TYPE,
  INVITATION,
} = require('../src/utils/constants');

// Mock dependencies
jest.mock('../../src/modules/invitations/invitation.model');
jest.mock('../../src/modules/memberships/membership.model');
jest.mock('../../src/modules/users/user.service');
jest.mock('../../src/modules/memberships/membership.service');
jest.mock('../../src/modules/notifications/notification.service');
jest.mock('../../src/modules/teams/team.model');

describe('Invitation Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createInvitation', () => {
    it('should create invitation successfully', async () => {
      const teamId = 1;
      const email = 'test@example.com';
      const role = MEMBERSHIP_ROLE.MEMBER;
      const inviterId = 1;
      const message = 'Welcome to the team!';
      const user = { id: 2, email };
      const inviter = { id: 1, first_name: 'John', last_name: 'Doe' };
      const team = { id: teamId, name: 'Test Team' };
      const inviterMembership = { role: MEMBERSHIP_ROLE.OWNER };
      const invitation = { id: 1, team_id: teamId, invited_user_id: user.id };
      const fullInvitation = { ...invitation, team_name: team.name };

      userService.findByEmail.mockResolvedValue(user);
      membershipService.findByUserAndTeam.mockResolvedValue(inviterMembership);
      membershipService.findByUserAndTeam.mockResolvedValue(null); // No existing membership
      InvitationModel.findPendingByTeamAndUser.mockResolvedValue(null);
      userService.findById.mockResolvedValue(inviter);
      TeamModel.findById.mockResolvedValue(team);
      InvitationModel.create.mockResolvedValue(invitation);
      InvitationModel.findById.mockResolvedValue(fullInvitation);
      notificationService.create.mockResolvedValue();

      const result = await invitationService.createInvitation(teamId, email, role, inviterId, message);

      expect(userService.findByEmail).toHaveBeenCalledWith(email);
      expect(membershipService.findByUserAndTeam).toHaveBeenCalledWith(inviterId, teamId);
      expect(InvitationModel.create).toHaveBeenCalled();
      expect(notificationService.create).toHaveBeenCalled();
      expect(result).toEqual(fullInvitation);
    });

    it('should throw error if user not found', async () => {
      const teamId = 1;
      const email = 'nonexistent@example.com';
      const role = MEMBERSHIP_ROLE.MEMBER;
      const inviterId = 1;

      userService.findByEmail.mockResolvedValue(null);

      await expect(invitationService.createInvitation(teamId, email, role, inviterId)).rejects.toThrow(ApiError);
    });

    it('should throw error if inviter has no permission', async () => {
      const teamId = 1;
      const email = 'test@example.com';
      const role = MEMBERSHIP_ROLE.MEMBER;
      const inviterId = 1;
      const user = { id: 2, email };
      const inviterMembership = { role: MEMBERSHIP_ROLE.MEMBER };

      userService.findByEmail.mockResolvedValue(user);
      membershipService.findByUserAndTeam.mockResolvedValue(inviterMembership);

      await expect(invitationService.createInvitation(teamId, email, role, inviterId)).rejects.toThrow(ApiError);
    });

    it('should throw error if trying to invite with owner role', async () => {
      const teamId = 1;
      const email = 'test@example.com';
      const role = MEMBERSHIP_ROLE.OWNER;
      const inviterId = 1;
      const user = { id: 2, email };
      const inviterMembership = { role: MEMBERSHIP_ROLE.OWNER };

      userService.findByEmail.mockResolvedValue(user);
      membershipService.findByUserAndTeam.mockResolvedValue(inviterMembership);

      await expect(invitationService.createInvitation(teamId, email, role, inviterId)).rejects.toThrow(ApiError);
    });

    it('should throw error if user is already a member', async () => {
      const teamId = 1;
      const email = 'test@example.com';
      const role = MEMBERSHIP_ROLE.MEMBER;
      const inviterId = 1;
      const user = { id: 2, email };
      const inviterMembership = { role: MEMBERSHIP_ROLE.OWNER };
      const existingMembership = { status: MEMBERSHIP_STATUS.ACTIVE };

      userService.findByEmail.mockResolvedValue(user);
      membershipService.findByUserAndTeam.mockResolvedValueOnce(inviterMembership);
      membershipService.findByUserAndTeam.mockResolvedValueOnce(existingMembership);

      await expect(invitationService.createInvitation(teamId, email, role, inviterId)).rejects.toThrow(ApiError);
    });

    it('should throw error if pending invitation already exists', async () => {
      const teamId = 1;
      const email = 'test@example.com';
      const role = MEMBERSHIP_ROLE.MEMBER;
      const inviterId = 1;
      const user = { id: 2, email };
      const inviterMembership = { role: MEMBERSHIP_ROLE.OWNER };
      const existingInvitation = { id: 1 };

      userService.findByEmail.mockResolvedValue(user);
      membershipService.findByUserAndTeam.mockResolvedValueOnce(inviterMembership);
      membershipService.findByUserAndTeam.mockResolvedValueOnce(null);
      InvitationModel.findPendingByTeamAndUser.mockResolvedValue(existingInvitation);

      await expect(invitationService.createInvitation(teamId, email, role, inviterId)).rejects.toThrow(ApiError);
    });

    it('should throw error if team not found', async () => {
      const teamId = 1;
      const email = 'test@example.com';
      const role = MEMBERSHIP_ROLE.MEMBER;
      const inviterId = 1;
      const user = { id: 2, email };
      const inviter = { id: 1, first_name: 'John', last_name: 'Doe' };
      const inviterMembership = { role: MEMBERSHIP_ROLE.OWNER };

      userService.findByEmail.mockResolvedValue(user);
      membershipService.findByUserAndTeam.mockResolvedValueOnce(inviterMembership);
      membershipService.findByUserAndTeam.mockResolvedValueOnce(null);
      InvitationModel.findPendingByTeamAndUser.mockResolvedValue(null);
      userService.findById.mockResolvedValue(inviter);
      TeamModel.findById.mockResolvedValue(null);

      await expect(invitationService.createInvitation(teamId, email, role, inviterId)).rejects.toThrow(ApiError);
    });
  });

  describe('getById', () => {
    it('should return invitation if user is invited user', async () => {
      const invitationId = 1;
      const userId = 2;
      const invitation = { id: invitationId, invited_user_id: userId, team_id: 1 };

      InvitationModel.findById.mockResolvedValue(invitation);

      const result = await invitationService.getById(invitationId, userId);

      expect(result).toEqual(invitation);
    });

    it('should return invitation if user is inviter', async () => {
      const invitationId = 1;
      const userId = 1;
      const invitation = { id: invitationId, invited_user_id: 2, invited_by: userId, team_id: 1 };

      InvitationModel.findById.mockResolvedValue(invitation);

      const result = await invitationService.getById(invitationId, userId);

      expect(result).toEqual(invitation);
    });

    it('should return invitation if user is team admin', async () => {
      const invitationId = 1;
      const userId = 3;
      const invitation = { id: invitationId, invited_user_id: 2, invited_by: 1, team_id: 1 };
      const membership = { role: MEMBERSHIP_ROLE.ADMIN };

      InvitationModel.findById.mockResolvedValue(invitation);
      membershipService.findByUserAndTeam.mockResolvedValue(membership);

      const result = await invitationService.getById(invitationId, userId);

      expect(result).toEqual(invitation);
    });

    it('should throw error if invitation not found', async () => {
      const invitationId = 1;
      const userId = 1;

      InvitationModel.findById.mockResolvedValue(null);

      await expect(invitationService.getById(invitationId, userId)).rejects.toThrow(ApiError);
    });

    it('should throw error if user has no access', async () => {
      const invitationId = 1;
      const userId = 3;
      const invitation = { id: invitationId, invited_user_id: 2, invited_by: 1, team_id: 1 };

      InvitationModel.findById.mockResolvedValue(invitation);
      membershipService.findByUserAndTeam.mockResolvedValue(null);

      await expect(invitationService.getById(invitationId, userId)).rejects.toThrow(ApiError);
    });
  });

  describe('getReceivedInvitations', () => {
    it('should return received invitations', async () => {
      const userId = 1;
      const filters = { status: 'pending' };
      const invitations = [{ id: 1, invited_user_id: userId }];

      InvitationModel.findByInvitedUser.mockResolvedValue(invitations);

      const result = await invitationService.getReceivedInvitations(userId, filters);

      expect(InvitationModel.findByInvitedUser).toHaveBeenCalledWith(userId, filters);
      expect(result).toEqual(invitations);
    });
  });

  describe('getSentInvitations', () => {
    it('should return sent invitations', async () => {
      const userId = 1;
      const filters = { status: 'pending' };
      const invitations = [{ id: 1, invited_by: userId }];

      InvitationModel.findByInviter.mockResolvedValue(invitations);

      const result = await invitationService.getSentInvitations(userId, filters);

      expect(InvitationModel.findByInviter).toHaveBeenCalledWith(userId, filters);
      expect(result).toEqual(invitations);
    });
  });

  describe('getTeamInvitations', () => {
    it('should return team invitations if user has permission', async () => {
      const teamId = 1;
      const userId = 1;
      const filters = { status: 'pending' };
      const invitations = [{ id: 1, team_id: teamId }];
      const membership = { role: MEMBERSHIP_ROLE.ADMIN };

      membershipService.findByUserAndTeam.mockResolvedValue(membership);
      InvitationModel.findByTeam.mockResolvedValue(invitations);

      const result = await invitationService.getTeamInvitations(teamId, userId, filters);

      expect(membershipService.findByUserAndTeam).toHaveBeenCalledWith(userId, teamId);
      expect(InvitationModel.findByTeam).toHaveBeenCalledWith(teamId, filters);
      expect(result).toEqual(invitations);
    });

    it('should throw error if user has no permission', async () => {
      const teamId = 1;
      const userId = 1;
      const membership = { role: MEMBERSHIP_ROLE.MEMBER };

      membershipService.findByUserAndTeam.mockResolvedValue(membership);

      await expect(invitationService.getTeamInvitations(teamId, userId)).rejects.toThrow(ApiError);
    });
  });

  describe('getPendingCount', () => {
    it('should return pending invitation count', async () => {
      const userId = 1;
      const count = 3;

      InvitationModel.countPendingByUser.mockResolvedValue(count);

      const result = await invitationService.getPendingCount(userId);

      expect(InvitationModel.countPendingByUser).toHaveBeenCalledWith(userId);
      expect(result).toEqual({ count });
    });
  });

  describe('acceptInvitation', () => {
    it('should accept invitation successfully', async () => {
      const invitationId = 1;
      const userId = 2;
      const invitation = {
        id: invitationId,
        invited_user_id: userId,
        status: INVITATION_STATUS.PENDING,
        expires_at: new Date(Date.now() + 86400000), // Future date
        team_id: 1,
        role: MEMBERSHIP_ROLE.MEMBER,
        invited_by: 1,
        team_name: 'Test Team'
      };
      const membership = { id: 1, user_id: userId, team_id: 1 };
      const user = { id: userId, first_name: 'John', last_name: 'Doe' };
      const acceptedInvitation = { ...invitation, status: INVITATION_STATUS.ACCEPTED };

      InvitationModel.findById.mockResolvedValue(invitation);
      InvitationModel.accept.mockResolvedValue();
      MembershipModel.create.mockResolvedValue(membership);
      userService.findById.mockResolvedValue(user);
      notificationService.create.mockResolvedValue();
      InvitationModel.findById.mockResolvedValue(acceptedInvitation);

      const result = await invitationService.acceptInvitation(invitationId, userId);

      expect(InvitationModel.accept).toHaveBeenCalledWith(invitationId);
      expect(MembershipModel.create).toHaveBeenCalledWith({
        user_id: userId,
        team_id: invitation.team_id,
        role: invitation.role,
        status: MEMBERSHIP_STATUS.ACTIVE,
        invitation_id: invitationId,
      });
      expect(notificationService.create).toHaveBeenCalled();
      expect(result).toEqual({
        invitation: acceptedInvitation,
        membership,
      });
    });

    it('should throw error if invitation not found', async () => {
      const invitationId = 1;
      const userId = 2;

      InvitationModel.findById.mockResolvedValue(null);

      await expect(invitationService.acceptInvitation(invitationId, userId)).rejects.toThrow(ApiError);
    });

    it('should throw error if user is not the invited user', async () => {
      const invitationId = 1;
      const userId = 3;
      const invitation = { id: invitationId, invited_user_id: 2 };

      InvitationModel.findById.mockResolvedValue(invitation);

      await expect(invitationService.acceptInvitation(invitationId, userId)).rejects.toThrow(ApiError);
    });

    it('should throw error if invitation is not pending', async () => {
      const invitationId = 1;
      const userId = 2;
      const invitation = { id: invitationId, invited_user_id: userId, status: INVITATION_STATUS.ACCEPTED };

      InvitationModel.findById.mockResolvedValue(invitation);

      await expect(invitationService.acceptInvitation(invitationId, userId)).rejects.toThrow(ApiError);
    });

    it('should throw error if invitation is expired', async () => {
      const invitationId = 1;
      const userId = 2;
      const invitation = {
        id: invitationId,
        invited_user_id: userId,
        status: INVITATION_STATUS.PENDING,
        expires_at: new Date(Date.now() - 86400000), // Past date
      };

      InvitationModel.findById.mockResolvedValue(invitation);

      await expect(invitationService.acceptInvitation(invitationId, userId)).rejects.toThrow(ApiError);
    });
  });

  describe('declineInvitation', () => {
    it('should decline invitation successfully', async () => {
      const invitationId = 1;
      const userId = 2;
      const invitation = {
        id: invitationId,
        invited_user_id: userId,
        status: INVITATION_STATUS.PENDING,
        team_id: 1,
        invited_by: 1,
        team_name: 'Test Team',
        role: MEMBERSHIP_ROLE.MEMBER
      };
      const user = { id: userId, first_name: 'John', last_name: 'Doe' };
      const declinedInvitation = { ...invitation, status: INVITATION_STATUS.DECLINED };

      InvitationModel.findById.mockResolvedValue(invitation);
      InvitationModel.decline.mockResolvedValue();
      userService.findById.mockResolvedValue(user);
      notificationService.create.mockResolvedValue();
      InvitationModel.findById.mockResolvedValue(declinedInvitation);

      const result = await invitationService.declineInvitation(invitationId, userId);

      expect(InvitationModel.decline).toHaveBeenCalledWith(invitationId);
      expect(notificationService.create).toHaveBeenCalled();
      expect(result).toEqual(declinedInvitation);
    });
  });

  describe('cancelInvitation', () => {
    it('should cancel invitation if user is inviter', async () => {
      const invitationId = 1;
      const userId = 1;
      const invitation = { id: invitationId, invited_by: userId, status: INVITATION_STATUS.PENDING };
      const cancelledInvitation = { ...invitation, status: INVITATION_STATUS.CANCELLED };

      InvitationModel.findById.mockResolvedValue(invitation);
      InvitationModel.cancel.mockResolvedValue();
      InvitationModel.findById.mockResolvedValue(cancelledInvitation);

      const result = await invitationService.cancelInvitation(invitationId, userId);

      expect(InvitationModel.cancel).toHaveBeenCalledWith(invitationId);
      expect(result).toEqual(cancelledInvitation);
    });

    it('should cancel invitation if user is team admin', async () => {
      const invitationId = 1;
      const userId = 2;
      const invitation = { id: invitationId, invited_by: 1, team_id: 1, status: INVITATION_STATUS.PENDING };
      const membership = { role: MEMBERSHIP_ROLE.ADMIN };
      const cancelledInvitation = { ...invitation, status: INVITATION_STATUS.CANCELLED };

      InvitationModel.findById.mockResolvedValue(invitation);
      membershipService.findByUserAndTeam.mockResolvedValue(membership);
      InvitationModel.cancel.mockResolvedValue();
      InvitationModel.findById.mockResolvedValue(cancelledInvitation);

      const result = await invitationService.cancelInvitation(invitationId, userId);

      expect(result).toEqual(cancelledInvitation);
    });

    it('should throw error if user has no permission', async () => {
      const invitationId = 1;
      const userId = 2;
      const invitation = { id: invitationId, invited_by: 1, team_id: 1, status: INVITATION_STATUS.PENDING };
      const membership = { role: MEMBERSHIP_ROLE.MEMBER };

      InvitationModel.findById.mockResolvedValue(invitation);
      membershipService.findByUserAndTeam.mockResolvedValue(membership);

      await expect(invitationService.cancelInvitation(invitationId, userId)).rejects.toThrow(ApiError);
    });
  });

  describe('resendInvitation', () => {
    it('should resend invitation successfully', async () => {
      const invitationId = 1;
      const userId = 1;
      const invitation = {
        id: invitationId,
        invited_by: userId,
        status: INVITATION_STATUS.PENDING,
        team_id: 1,
        invited_user_id: 2,
        team_name: 'Test Team',
        role: MEMBERSHIP_ROLE.MEMBER,
        message: 'Welcome!'
      };
      const inviter = { id: userId, first_name: 'John', last_name: 'Doe' };
      const resentInvitation = { ...invitation };

      InvitationModel.findById.mockResolvedValue(invitation);
      userService.findById.mockResolvedValue(inviter);
      InvitationModel.update.mockResolvedValue();
      notificationService.create.mockResolvedValue();
      InvitationModel.findById.mockResolvedValue(resentInvitation);

      const result = await invitationService.resendInvitation(invitationId, userId);

      expect(InvitationModel.update).toHaveBeenCalled();
      expect(notificationService.create).toHaveBeenCalled();
      expect(result).toEqual(resentInvitation);
    });
  });

  describe('acceptInvitationPublic', () => {
    it('should accept invitation from public link', async () => {
      const invitationId = 1;
      const invitation = {
        id: invitationId,
        invited_user_id: 2,
        status: INVITATION_STATUS.PENDING,
        expires_at: new Date(Date.now() + 86400000),
        team_id: 1,
        role: MEMBERSHIP_ROLE.MEMBER,
        invited_by: 1,
        team_name: 'Test Team'
      };
      const membership = { id: 1 };
      const user = { id: 2, first_name: 'John', last_name: 'Doe' };
      const acceptedInvitation = { ...invitation, status: INVITATION_STATUS.ACCEPTED };

      InvitationModel.findById.mockResolvedValue(invitation);
      InvitationModel.accept.mockResolvedValue();
      MembershipModel.create.mockResolvedValue(membership);
      userService.findById.mockResolvedValue(user);
      notificationService.create.mockResolvedValue();
      InvitationModel.findById.mockResolvedValue(acceptedInvitation);

      const result = await invitationService.acceptInvitationPublic(invitationId);

      expect(result).toEqual({
        invitation: acceptedInvitation,
        membership,
      });
    });
  });

  describe('declineInvitationPublic', () => {
    it('should decline invitation from public link', async () => {
      const invitationId = 1;
      const invitation = {
        id: invitationId,
        invited_user_id: 2,
        status: INVITATION_STATUS.PENDING,
        expires_at: new Date(Date.now() + 86400000),
        team_id: 1,
        invited_by: 1,
        team_name: 'Test Team',
        role: MEMBERSHIP_ROLE.MEMBER
      };
      const user = { id: 2, first_name: 'John', last_name: 'Doe' };
      const declinedInvitation = { ...invitation, status: INVITATION_STATUS.DECLINED };

      InvitationModel.findById.mockResolvedValue(invitation);
      InvitationModel.decline.mockResolvedValue();
      userService.findById.mockResolvedValue(user);
      notificationService.create.mockResolvedValue();
      InvitationModel.findById.mockResolvedValue(declinedInvitation);

      const result = await invitationService.declineInvitationPublic(invitationId);

      expect(result).toEqual(declinedInvitation);
    });
  });
});