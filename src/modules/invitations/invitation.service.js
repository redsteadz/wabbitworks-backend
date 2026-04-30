const InvitationModel = require('./invitation.model');
const MembershipModel = require('../memberships/membership.model');
const userService = require('../users/user.service');
const membershipService = require('../memberships/membership.service');
const notificationService = require('../notifications/notification.service');
const ApiError = require('../../utils/ApiError');
const {
  MEMBERSHIP_ROLE,
  MEMBERSHIP_STATUS,
  INVITATION_STATUS,
  NOTIFICATION_TYPE,
  INVITATION,
} = require('../../utils/constants');
const env = require('../../config/env');

/**
 * Create team invitation
 */
const createInvitation = async (teamId, email, role, inviterId, message = null) => {
  // Find user by email
  const user = await userService.findByEmail(email);
  if (!user) {
    throw ApiError.notFound('User not found with this email. They need to register first.');
  }

  // Check if inviter has permission
  const inviterMembership = await membershipService.findByUserAndTeam(inviterId, teamId);
  if (!inviterMembership || ![MEMBERSHIP_ROLE.OWNER, MEMBERSHIP_ROLE.ADMIN].includes(inviterMembership.role)) {
    throw ApiError.forbidden('You do not have permission to invite members');
  }

  // Cannot invite with owner role
  if (role === MEMBERSHIP_ROLE.OWNER) {
    throw ApiError.forbidden('Cannot invite with owner role');
  }

  // Check if user is already a member
  const existingMembership = await membershipService.findByUserAndTeam(user.id, teamId);
  if (existingMembership && existingMembership.status === MEMBERSHIP_STATUS.ACTIVE) {
    throw ApiError.conflict('User is already a member of this team');
  }

  // Check if there's already a pending invitation
  const existingInvitation = await InvitationModel.findPendingByTeamAndUser(teamId, user.id);
  if (existingInvitation) {
    throw ApiError.conflict('An invitation has already been sent to this user');
  }

  // Get inviter details
  const inviter = await userService.findById(inviterId);

  // Get team details
  const TeamModel = require('../teams/team.model');
  const team = await TeamModel.findById(teamId);
  if (!team) {
    throw ApiError.notFound('Team not found');
  }

  // Calculate expiration date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITATION.EXPIRY_DAYS);

  // Create invitation
  const invitation = await InvitationModel.create({
    team_id: teamId,
    invited_user_id: user.id,
    invited_by: inviterId,
    invited_email: email.toLowerCase(),
    role: role || MEMBERSHIP_ROLE.MEMBER,
    status: INVITATION_STATUS.PENDING,
    message,
    expires_at: expiresAt,
  });

  // Build URLs for email
  const acceptUrl = `${env.frontend.url}/api/invitations/public/${invitation.id}/accept`;
  const declineUrl = `${env.frontend.url}/api/invitations/public/${invitation.id}/decline`;
  const viewUrl = `${env.frontend.url}/invitations/${invitation.id}`;

  // Send notification to invited user
  await notificationService.create({
    userId: user.id,
    actorId: inviterId,
    type: NOTIFICATION_TYPE.TEAM_INVITATION,
    title: `Team Invitation: ${team.name}`,
    message: `${inviter.first_name} ${inviter.last_name} has invited you to join ${team.name} as a ${role}`,
    metadata: {
      invitationId: invitation.id,
      teamId,
      teamName: team.name,
      role,
      message,
      acceptUrl,
      declineUrl,
      viewUrl,
      expiresAt: expiresAt.toLocaleDateString(),
    },
    actionUrl: viewUrl,
    sendEmail: true,
  });

  // Return invitation with details
  return InvitationModel.findById(invitation.id);
};

/**
 * Get invitation by ID
 */
const getById = async (invitationId, userId) => {
  const invitation = await InvitationModel.findById(invitationId);

  if (!invitation) {
    throw ApiError.notFound('Invitation not found');
  }

  // Check if user has access (invited user, inviter, or team admin)
  const isInvitedUser = invitation.invited_user_id === userId;
  const isInviter = invitation.invited_by === userId;

  if (!isInvitedUser && !isInviter) {
    // Check if user is team admin/owner
    const membership = await membershipService.findByUserAndTeam(userId, invitation.team_id);
    if (!membership || ![MEMBERSHIP_ROLE.OWNER, MEMBERSHIP_ROLE.ADMIN].includes(membership.role)) {
      throw ApiError.forbidden('You do not have access to this invitation');
    }
  }

  return invitation;
};

/**
 * Get received invitations for a user
 */
const getReceivedInvitations = async (userId, filters = {}) => {
  return InvitationModel.findByInvitedUser(userId, filters);
};

/**
 * Get sent invitations by a user
 */
const getSentInvitations = async (userId, filters = {}) => {
  return InvitationModel.findByInviter(userId, filters);
};

/**
 * Get invitations for a team
 */
const getTeamInvitations = async (teamId, userId, filters = {}) => {
  // Check if user has permission to view team invitations
  const membership = await membershipService.findByUserAndTeam(userId, teamId);
  if (!membership || ![MEMBERSHIP_ROLE.OWNER, MEMBERSHIP_ROLE.ADMIN].includes(membership.role)) {
    throw ApiError.forbidden('You do not have permission to view team invitations');
  }

  return InvitationModel.findByTeam(teamId, filters);
};

/**
 * Get pending invitation count for a user
 */
const getPendingCount = async (userId) => {
  const count = await InvitationModel.countPendingByUser(userId);
  return { count };
};

/**
 * Accept invitation
 */
const acceptInvitation = async (invitationId, userId) => {
  const invitation = await InvitationModel.findById(invitationId);

  if (!invitation) {
    throw ApiError.notFound('Invitation not found');
  }

  // Check if user is the invited user
  if (invitation.invited_user_id !== userId) {
    throw ApiError.forbidden('You cannot accept this invitation');
  }

  // Check if invitation is still pending
  if (invitation.status !== INVITATION_STATUS.PENDING) {
    throw ApiError.badRequest(`Invitation has already been ${invitation.status}`);
  }

  // Check if invitation is expired
  if (new Date(invitation.expires_at) < new Date()) {
    throw ApiError.badRequest('Invitation has expired');
  }

  // Accept the invitation
  await InvitationModel.accept(invitationId);

  // Create membership
  const membership = await MembershipModel.create({
    user_id: userId,
    team_id: invitation.team_id,
    role: invitation.role,
    status: MEMBERSHIP_STATUS.ACTIVE,
    invitation_id: invitationId,
  });

  // Get user details
  const user = await userService.findById(userId);

  // Send notification to inviter
  await notificationService.create({
    userId: invitation.invited_by,
    actorId: userId,
    type: NOTIFICATION_TYPE.INVITATION_ACCEPTED,
    title: 'Invitation Accepted',
    message: `${user.first_name} ${user.last_name} has accepted your invitation to join ${invitation.team_name}`,
    metadata: {
      invitationId,
      teamId: invitation.team_id,
      teamName: invitation.team_name,
      role: invitation.role,
      teamUrl: `${env.frontend.url}/teams/${invitation.team_id}/members`,
    },
    actionUrl: `${env.frontend.url}/teams/${invitation.team_id}/members`,
    sendEmail: true,
  });

  return {
    invitation: await InvitationModel.findById(invitationId),
    membership,
  };
};

/**
 * Decline invitation
 */
const declineInvitation = async (invitationId, userId) => {
  const invitation = await InvitationModel.findById(invitationId);

  if (!invitation) {
    throw ApiError.notFound('Invitation not found');
  }

  // Check if user is the invited user
  if (invitation.invited_user_id !== userId) {
    throw ApiError.forbidden('You cannot decline this invitation');
  }

  // Check if invitation is still pending
  if (invitation.status !== INVITATION_STATUS.PENDING) {
    throw ApiError.badRequest(`Invitation has already been ${invitation.status}`);
  }

  // Decline the invitation
  await InvitationModel.decline(invitationId);

  // Get user details
  const user = await userService.findById(userId);

  // Send notification to inviter
  await notificationService.create({
    userId: invitation.invited_by,
    actorId: userId,
    type: NOTIFICATION_TYPE.INVITATION_DECLINED,
    title: 'Invitation Declined',
    message: `${user.first_name} ${user.last_name} has declined your invitation to join ${invitation.team_name}`,
    metadata: {
      invitationId,
      teamId: invitation.team_id,
      teamName: invitation.team_name,
      role: invitation.role,
      teamUrl: `${env.frontend.url}/teams/${invitation.team_id}`,
    },
    actionUrl: `${env.frontend.url}/teams/${invitation.team_id}`,
    sendEmail: true,
  });

  return InvitationModel.findById(invitationId);
};

/**
 * Cancel invitation (by inviter or admin)
 */
const cancelInvitation = async (invitationId, userId) => {
  const invitation = await InvitationModel.findById(invitationId);

  if (!invitation) {
    throw ApiError.notFound('Invitation not found');
  }

  // Check if user has permission to cancel
  const isInviter = invitation.invited_by === userId;
  
  if (!isInviter) {
    const membership = await membershipService.findByUserAndTeam(userId, invitation.team_id);
    if (!membership || ![MEMBERSHIP_ROLE.OWNER, MEMBERSHIP_ROLE.ADMIN].includes(membership.role)) {
      throw ApiError.forbidden('You do not have permission to cancel this invitation');
    }
  }

  // Check if invitation is still pending
  if (invitation.status !== INVITATION_STATUS.PENDING) {
    throw ApiError.badRequest(`Invitation has already been ${invitation.status}`);
  }

  // Cancel the invitation
  await InvitationModel.cancel(invitationId);

  return InvitationModel.findById(invitationId);
};

/**
 * Resend invitation
 */
const resendInvitation = async (invitationId, userId) => {
  const invitation = await InvitationModel.findById(invitationId);

  if (!invitation) {
    throw ApiError.notFound('Invitation not found');
  }

  // Check if user has permission
  const isInviter = invitation.invited_by === userId;
  
  if (!isInviter) {
    const membership = await membershipService.findByUserAndTeam(userId, invitation.team_id);
    if (!membership || ![MEMBERSHIP_ROLE.OWNER, MEMBERSHIP_ROLE.ADMIN].includes(membership.role)) {
      throw ApiError.forbidden('You do not have permission to resend this invitation');
    }
  }

  // Check if invitation is still pending
  if (invitation.status !== INVITATION_STATUS.PENDING) {
    throw ApiError.badRequest(`Cannot resend - invitation has been ${invitation.status}`);
  }

  // Get inviter details
  const inviter = await userService.findById(invitation.invited_by);

  // Update expiration
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITATION.EXPIRY_DAYS);

  await InvitationModel.update(invitationId, {
    expires_at: expiresAt,
  });

  // Build URLs
  const acceptUrl = `${env.frontend.url}/api/invitations/public/${invitationId}/accept`;
  const declineUrl = `${env.frontend.url}/api/invitations/public/${invitationId}/decline`;
  const viewUrl = `${env.frontend.url}/invitations/${invitationId}`;

  // Send notification again
  await notificationService.create({
    userId: invitation.invited_user_id,
    actorId: invitation.invited_by,
    type: NOTIFICATION_TYPE.TEAM_INVITATION,
    title: `Reminder: Team Invitation - ${invitation.team_name}`,
    message: `${inviter.first_name} ${inviter.last_name} is waiting for your response to join ${invitation.team_name}`,
    metadata: {
      invitationId,
      teamId: invitation.team_id,
      teamName: invitation.team_name,
      role: invitation.role,
      message: invitation.message,
      acceptUrl,
      declineUrl,
      viewUrl,
      expiresAt: expiresAt.toLocaleDateString(),
    },
    actionUrl: viewUrl,
    sendEmail: true,
  });

  return InvitationModel.findById(invitationId);
};

/**
 * Accept invitation from public email link (no authentication required)
 */
const acceptInvitationPublic = async (invitationId) => {
  const invitation = await InvitationModel.findById(invitationId);

  if (!invitation) {
    throw ApiError.notFound('Invitation not found');
  }

  // Check if invitation is still pending
  if (invitation.status !== INVITATION_STATUS.PENDING) {
    throw ApiError.badRequest(`Invitation has already been ${invitation.status}`);
  }

  // Check if invitation is expired
  if (new Date(invitation.expires_at) < new Date()) {
    throw ApiError.badRequest('Invitation has expired');
  }

  const userId = invitation.invited_user_id;

  // Accept the invitation
  await InvitationModel.accept(invitationId);

  // Create membership
  const membership = await MembershipModel.create({
    user_id: userId,
    team_id: invitation.team_id,
    role: invitation.role,
    status: MEMBERSHIP_STATUS.ACTIVE,
    invitation_id: invitationId,
  });

  // Get user details
  const user = await userService.findById(userId);

  // Send notification to inviter
  await notificationService.create({
    userId: invitation.invited_by,
    actorId: userId,
    type: NOTIFICATION_TYPE.INVITATION_ACCEPTED,
    title: 'Invitation Accepted',
    message: `${user.first_name} ${user.last_name} has accepted your invitation to join ${invitation.team_name}`,
    metadata: {
      invitationId,
      teamId: invitation.team_id,
      teamName: invitation.team_name,
      role: invitation.role,
      teamUrl: `${env.frontend.url}/teams/${invitation.team_id}/members`,
    },
    actionUrl: `${env.frontend.url}/teams/${invitation.team_id}/members`,
    sendEmail: true,
  });

  return {
    invitation: await InvitationModel.findById(invitationId),
    membership,
  };
};

/**
 * Decline invitation from public email link (no authentication required)
 */
const declineInvitationPublic = async (invitationId) => {
  const invitation = await InvitationModel.findById(invitationId);

  if (!invitation) {
    throw ApiError.notFound('Invitation not found');
  }

  // Check if invitation is still pending
  if (invitation.status !== INVITATION_STATUS.PENDING) {
    throw ApiError.badRequest(`Invitation has already been ${invitation.status}`);
  }

  // Check if invitation is expired
  if (new Date(invitation.expires_at) < new Date()) {
    throw ApiError.badRequest('Invitation has expired');
  }

  const userId = invitation.invited_user_id;

  // Decline the invitation
  await InvitationModel.decline(invitationId);

  // Get user details
  const user = await userService.findById(userId);

  // Send notification to inviter
  await notificationService.create({
    userId: invitation.invited_by,
    actorId: userId,
    type: NOTIFICATION_TYPE.INVITATION_DECLINED,
    title: 'Invitation Declined',
    message: `${user.first_name} ${user.last_name} has declined your invitation to join ${invitation.team_name}`,
    metadata: {
      invitationId,
      teamId: invitation.team_id,
      teamName: invitation.team_name,
      role: invitation.role,
      teamUrl: `${env.frontend.url}/teams/${invitation.team_id}`,
    },
    actionUrl: `${env.frontend.url}/teams/${invitation.team_id}`,
    sendEmail: true,
  });

  return InvitationModel.findById(invitationId);
};

module.exports = {
  createInvitation,
  getById,
  getReceivedInvitations,
  getSentInvitations,
  getTeamInvitations,
  getPendingCount,
  acceptInvitation,
  declineInvitation,
  cancelInvitation,
  resendInvitation,
  acceptInvitationPublic,
  declineInvitationPublic,
};