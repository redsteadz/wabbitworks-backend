const TeamModel = require('./team.model');
const membershipService = require('../memberships/membership.service');
const ApiError = require('../../utils/ApiError');
const { MEMBERSHIP_ROLE } = require('../../utils/constants');

// Create a new team and add creator as owner
const create = async (teamData, userId) => {
  // Create the team
  const team = await TeamModel.create({
    ...teamData,
    created_by: userId,
  });

  // Add creator as owner
  await membershipService.create({
    user_id: userId,
    team_id: team.id,
    role: MEMBERSHIP_ROLE.OWNER,
  });

  return team;
};

// Get team by ID
const findById = async (id) => {
  const team = await TeamModel.findByIdWithCreator(id);
  if (!team) {
    throw ApiError.notFound('Team not found');
  }
  return team;
};

// Get team with member and task counts
const findByIdWithCounts = async (id) => {
  const team = await findById(id);
  const [memberCount, taskCount] = await Promise.all([
    TeamModel.getMemberCount(id),
    TeamModel.getTaskCount(id),
  ]);

  return {
    ...team,
    member_count: memberCount,
    task_count: taskCount,
  };
};

// Get all teams for a user
const findByUser = async (userId) => {
  const teams = await TeamModel.findByUser(userId);

  // Get counts for each team
  const teamsWithCounts = await Promise.all(
    teams.map(async (team) => {
      const [memberCount, taskCount] = await Promise.all([
        TeamModel.getMemberCount(team.id),
        TeamModel.getTaskCount(team.id),
      ]);
      return {
        ...team,
        member_count: memberCount,
        task_count: taskCount,
      };
    })
  );

  return teamsWithCounts;
};

// Update team
const update = async (id, teamData, userId) => {
  const team = await TeamModel.findById(id);
  if (!team) {
    throw ApiError.notFound('Team not found');
  }

  // Check if user is owner
  const membership = await membershipService.findByUserAndTeam(userId, id);
  if (!membership || membership.role !== MEMBERSHIP_ROLE.OWNER) {
    throw ApiError.forbidden('Only team owner can update team');
  }

  return TeamModel.update(id, teamData);
};

// Delete team (soft delete)
const remove = async (id, userId) => {
  const team = await TeamModel.findById(id);
  if (!team) {
    throw ApiError.notFound('Team not found');
  }

  // Check if user is owner
  if (team.created_by !== userId) {
    throw ApiError.forbidden('Only team creator can delete team');
  }

  await TeamModel.softDelete(id);
  return { message: 'Team deleted successfully' };
};

// Get team members
const getMembers = async (teamId) => {
  const team = await TeamModel.findById(teamId);
  if (!team) {
    throw ApiError.notFound('Team not found');
  }

  return membershipService.findByTeam(teamId);
};

module.exports = {
  create,
  findById,
  findByIdWithCounts,
  findByUser,
  update,
  remove,
  getMembers,
};