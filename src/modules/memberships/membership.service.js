const MembershipModel = require('./membership.model');
const userService = require('../users/user.service');
const ApiError = require('../../utils/ApiError');
const { MEMBERSHIP_ROLE, MEMBERSHIP_STATUS } = require('../../utils/constants');

// Create a new membership
const create = async (membershipData) => {
  // Check if membership already exists
  const existing = await MembershipModel.findByUserAndTeam(
    membershipData.user_id,
    membershipData.team_id
  );

  if (existing) {
    if (existing.status === MEMBERSHIP_STATUS.ACTIVE) {
      throw ApiError.conflict('User is already a member of this team');
    }
    // Reactivate if previously inactive
    return MembershipModel.update(existing.id, {
      status: MEMBERSHIP_STATUS.ACTIVE,
      role: membershipData.role || MEMBERSHIP_ROLE.MEMBER,
    });
  }

  return MembershipModel.create(membershipData);
};

// Simple Finders
const findByUserAndTeam = async (userId, teamId) => MembershipModel.findByUserAndTeam(userId, teamId);
const findByUser = async (userId) => MembershipModel.findByUser(userId);
const findByTeam = async (teamId) => MembershipModel.findByTeam(teamId);
const getTeamMembers = async (teamId) => MembershipModel.findByTeam(teamId);

// Add member to team
const addMember = async (teamId, email, role, inviterId) => {
  // Find user by email
  const user = await userService.findByEmail(email);
  if (!user) throw ApiError.notFound('User not found with this email');

  // Check if inviter has permission
  const inviterMembership = await findByUserAndTeam(inviterId, teamId);
  if (!inviterMembership || ![MEMBERSHIP_ROLE.OWNER, MEMBERSHIP_ROLE.ADMIN].includes(inviterMembership.role)) {
    throw ApiError.forbidden('You do not have permission to add members');
  }

  // Cannot add owner role
  if (role === MEMBERSHIP_ROLE.OWNER) throw ApiError.forbidden('Cannot assign owner role');

  return create({
    user_id: user.id,
    team_id: teamId,
    role: role || MEMBERSHIP_ROLE.MEMBER,
    invited_email: email,
  });
};

/**
 * Update member role
 * UPDATED: Uses membershipId (not userId)
 */
const updateRole = async (teamId, membershipId, newRole, requesterId) => {
  // 1. Find the membership by ID
  const targetMembership = await MembershipModel.findById(membershipId);
  if (!targetMembership) {
    throw ApiError.notFound('Membership not found');
  }

  // 2. Security Check: Ensure membership belongs to this team
  if (targetMembership.team_id !== teamId) {
    throw ApiError.badRequest('Membership does not belong to this team');
  }

  // 3. Permissions
  const requesterMembership = await findByUserAndTeam(requesterId, teamId);
  if (!requesterMembership || requesterMembership.role !== MEMBERSHIP_ROLE.OWNER) {
    throw ApiError.forbidden('Only team owner can change member roles');
  }

  if (targetMembership.role === MEMBERSHIP_ROLE.OWNER) throw ApiError.forbidden('Cannot change owner role');
  if (newRole === MEMBERSHIP_ROLE.OWNER) throw ApiError.forbidden('Cannot assign owner role directly');

  return MembershipModel.update(membershipId, { role: newRole });
};

/**
 * Remove member
 * UPDATED: Uses membershipId (not userId)
 */
const removeMember = async (teamId, membershipId, requesterId) => {
  // 1. Find the membership by ID
  const targetMembership = await MembershipModel.findById(membershipId);
  if (!targetMembership) {
    throw ApiError.notFound('Membership not found');
  }

  // 2. Security Check: Ensure membership belongs to this team
  if (targetMembership.team_id !== teamId) {
    throw ApiError.badRequest('Membership does not belong to this team');
  }

  // 3. Permissions
  if (targetMembership.role === MEMBERSHIP_ROLE.OWNER) {
    throw ApiError.forbidden('Cannot remove team owner');
  }

  const isSelf = targetMembership.user_id === requesterId;
  
  if (!isSelf) {
    const requesterMembership = await findByUserAndTeam(requesterId, teamId);
    const hasPermission = requesterMembership && 
      [MEMBERSHIP_ROLE.OWNER, MEMBERSHIP_ROLE.ADMIN].includes(requesterMembership.role);

    if (!hasPermission) {
      throw ApiError.forbidden('You do not have permission to remove this member');
    }
  }

  // 4. Delete by ID
  await MembershipModel.delete(membershipId);
  return { message: 'Member removed successfully' };
};

const leaveTeam = async (userId, teamId) => {
  const membership = await findByUserAndTeam(userId, teamId);
  if (!membership) throw ApiError.notFound('You are not a member of this team');
  if (membership.role === MEMBERSHIP_ROLE.OWNER) throw ApiError.forbidden('Team owner cannot leave');
  
  await MembershipModel.deleteByUserAndTeam(userId, teamId);
  return { message: 'Successfully left the team' };
};

module.exports = {
  getTeamMembers,
  create,
  findByUserAndTeam,
  findByUser,
  findByTeam,
  addMember,
  updateRole,
  removeMember,
  leaveTeam,
};