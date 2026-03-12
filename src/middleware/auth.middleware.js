const ApiError = require('../utils/ApiError');
const membershipService = require('../modules/memberships/membership.service');
const { MEMBERSHIP_ROLE, MEMBERSHIP_STATUS } = require('../utils/constants');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  throw ApiError.unauthorized('Please log in to access this resource');
};

// Middleware to check if user is a member of a team
const isTeamMember = async (req, res, next) => {
  try {
    const teamId = req.params.id;
    const userId = req.user.id;

    if (!teamId) {
      throw ApiError.badRequest('Team ID is required');
    }

    const membership = await membershipService.findByUserAndTeam(userId, teamId);

    if (!membership || membership.status !== MEMBERSHIP_STATUS.ACTIVE) {
      throw ApiError.forbidden('You are not a member of this team');
    }

    req.membership = membership;
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware to check if user is team owner
const isTeamOwner = async (req, res, next) => {
  try {
    const teamId = req.params.teamId || req.params.id;
    const userId = req.user.id;

    if (!teamId) {
      throw ApiError.badRequest('Team ID is required');
    }

    const membership = await membershipService.findByUserAndTeam(userId, teamId);

    if (!membership || membership.role !== MEMBERSHIP_ROLE.OWNER) {
      throw ApiError.forbidden('Only team owner can perform this action');
    }

    req.membership = membership;
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware to check if user is team owner or admin
const isTeamAdmin = async (req, res, next) => {
  try {
    const teamId = req.params.teamId || req.params.id;
    const userId = req.user.id;

    if (!teamId) {
      throw ApiError.badRequest('Team ID is required');
    }

    const membership = await membershipService.findByUserAndTeam(userId, teamId);

    if (!membership) {
      throw ApiError.forbidden('You are not a member of this team');
    }

    if (![MEMBERSHIP_ROLE.OWNER, MEMBERSHIP_ROLE.ADMIN].includes(membership.role)) {
      throw ApiError.forbidden('Only team owners and admins can perform this action');
    }

    req.membership = membership;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  isAuthenticated,
  isTeamMember,
  isTeamOwner,
  isTeamAdmin,
};