const sanitizeHtml = require('sanitize-html');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { db } = require('../config/db');
const { getMembership } = require('../middlewares/auth');

const listTeams = catchAsync(async (req, res) => {
  const teams = await db('teams')
    .join('memberships', 'teams.id', 'memberships.team_id')
    .where({ 'memberships.user_id': req.user.id, 'memberships.status': 'active', 'teams.is_active': true })
    .select(
      'teams.id',
      'teams.name',
      'teams.description',
      'teams.created_by',
      'teams.created_at',
      'teams.updated_at',
      'memberships.role'
    )
    .orderBy('teams.created_at', 'desc');

  res.json({ teams });
});

const createTeam = catchAsync(async (req, res) => {
  const description = req.body.description ? sanitizeHtml(req.body.description, { allowedTags: [], allowedAttributes: {} }) : null;

  const [team] = await db('teams')
    .insert({
      name: req.body.name,
      description,
      created_by: req.user.id,
    })
    .returning(['id', 'name', 'description', 'created_by', 'created_at']);

  await db('memberships').insert({
    user_id: req.user.id,
    team_id: team.id,
    role: 'owner',
    status: 'active',
  });

  res.status(201).json({ team });
});

const getTeam = catchAsync(async (req, res, next) => {
  const { teamId } = req.params;
  const membership = await getMembership(req.user.id, teamId);
  if (!membership) {
    return next(ApiError.forbidden('Not a member of this team'));
  }

  const team = await db('teams').where({ id: teamId, is_active: true }).first();
  if (!team) {
    return next(ApiError.notFound('Team not found'));
  }

  const membersCount = await db('memberships').where({ team_id: teamId, status: 'active' }).count().first();

  res.json({
    team: {
      ...team,
      members_count: parseInt(membersCount.count, 10),
      role: membership.role,
    },
  });
});

const updateTeam = catchAsync(async (req, res, next) => {
  const { teamId } = req.params;
  const membership = await getMembership(req.user.id, teamId);
  if (!membership) {
    return next(ApiError.forbidden('Not a member of this team'));
  }
  if (!['owner', 'admin'].includes(membership.role)) {
    return next(ApiError.forbidden('Insufficient permissions'));
  }

  const updates = {};
  if (req.body.name) updates.name = req.body.name;
  if (Object.prototype.hasOwnProperty.call(req.body, 'description')) {
    updates.description = req.body.description
      ? sanitizeHtml(req.body.description, { allowedTags: [], allowedAttributes: {} })
      : null;
  }
  updates.updated_at = db.fn.now();

  const [team] = await db('teams').where({ id: teamId }).update(updates).returning(['id', 'name', 'description', 'updated_at']);

  res.json({ team });
});

const removeTeam = catchAsync(async (req, res, next) => {
  const { teamId } = req.params;
  const membership = await getMembership(req.user.id, teamId);
  if (!membership) {
    return next(ApiError.forbidden('Not a member of this team'));
  }
  if (membership.role !== 'owner') {
    return next(ApiError.forbidden('Only owners can archive a team'));
  }

  await db('teams')
    .where({ id: teamId })
    .update({ is_active: false, updated_at: db.fn.now() });

  res.status(204).send();
});

const listMembers = catchAsync(async (req, res, next) => {
  const { teamId } = req.params;
  const membership = await getMembership(req.user.id, teamId);
  if (!membership) {
    return next(ApiError.forbidden('Not a member of this team'));
  }

  const members = await db('memberships')
    .join('users', 'memberships.user_id', 'users.id')
    .where({ 'memberships.team_id': teamId })
    .select(
      'memberships.id',
      'memberships.role',
      'memberships.status',
      'memberships.created_at',
      'users.id as user_id',
      'users.email',
      'users.first_name',
      'users.last_name',
      'users.avatar_url'
    )
    .orderBy('users.first_name', 'asc');

  res.json({ members });
});

const addMember = catchAsync(async (req, res, next) => {
  const { teamId } = req.params;
  const membership = await getMembership(req.user.id, teamId);
  if (!membership) {
    return next(ApiError.forbidden('Not a member of this team'));
  }
  if (!['owner', 'admin'].includes(membership.role)) {
    return next(ApiError.forbidden('Insufficient permissions'));
  }

  const user = await db('users').where({ email: req.body.email }).first();
  if (!user) {
    return next(ApiError.notFound('User not found'));
  }

  const existing = await db('memberships').where({ user_id: user.id, team_id: teamId }).first();
  if (existing) {
    const [updated] = await db('memberships')
      .where({ id: existing.id })
      .update({
        role: req.body.role || existing.role,
        status: 'active',
        updated_at: db.fn.now(),
      })
      .returning(['id', 'user_id', 'team_id', 'role', 'status']);

    return res.json({ member: updated });
  }

  const [member] = await db('memberships')
    .insert({
      user_id: user.id,
      team_id: teamId,
      role: req.body.role || 'member',
      status: 'active',
    })
    .returning(['id', 'user_id', 'team_id', 'role', 'status']);

  res.status(201).json({ member });
});

const updateMember = catchAsync(async (req, res, next) => {
  const { teamId, membershipId } = req.params;
  const membership = await getMembership(req.user.id, teamId);
  if (!membership) {
    return next(ApiError.forbidden('Not a member of this team'));
  }
  if (!['owner', 'admin'].includes(membership.role)) {
    return next(ApiError.forbidden('Insufficient permissions'));
  }

  const updates = {};
  if (req.body.role) updates.role = req.body.role;
  if (req.body.status) updates.status = req.body.status;
  updates.updated_at = db.fn.now();

  const [member] = await db('memberships')
    .where({ id: membershipId, team_id: teamId })
    .update(updates)
    .returning(['id', 'user_id', 'team_id', 'role', 'status']);

  if (!member) {
    return next(ApiError.notFound('Membership not found'));
  }

  res.json({ member });
});

const removeMember = catchAsync(async (req, res, next) => {
  const { teamId, membershipId } = req.params;
  const membership = await getMembership(req.user.id, teamId);
  if (!membership) {
    return next(ApiError.forbidden('Not a member of this team'));
  }
  if (!['owner', 'admin'].includes(membership.role)) {
    return next(ApiError.forbidden('Insufficient permissions'));
  }

  await db('memberships').where({ id: membershipId, team_id: teamId }).delete();

  res.status(204).send();
});

module.exports = {
  listTeams,
  createTeam,
  getTeam,
  updateTeam,
  removeTeam,
  listMembers,
  addMember,
  updateMember,
  removeMember,
};
