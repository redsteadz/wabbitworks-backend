const ApiError = require('../utils/ApiError');
const { db } = require('../config/db');

const requireAuth = async (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return next(ApiError.unauthorized('Please login to continue'));
  }

  const user = await db('users')
    .select('id', 'email', 'first_name', 'last_name', 'avatar_url', 'is_active')
    .where({ id: req.session.userId })
    .first();

  if (!user || !user.is_active) {
    return next(ApiError.unauthorized('Account not found or inactive'));
  }

  req.user = user;
  return next();
};

const getMembership = async (userId, teamId) => {
  return db('memberships')
    .where({ user_id: userId, team_id: teamId, status: 'active' })
    .first();
};

const requireTeamRole = (roles = []) => {
  return async (req, res, next) => {
    const { teamId } = req.params;
    if (!teamId) {
      return next(ApiError.badRequest('Missing teamId'));
    }

    const membership = await getMembership(req.user.id, teamId);
    if (!membership) {
      return next(ApiError.forbidden('Not a member of this team'));
    }

    if (roles.length && !roles.includes(membership.role)) {
      return next(ApiError.forbidden('Insufficient team permissions'));
    }

    req.membership = membership;
    return next();
  };
};

module.exports = { requireAuth, requireTeamRole, getMembership };
