const membershipService = require('./membership.service');
const catchAsync = require('../../utils/catchAsync');

/**
 * Get team members
 * @route GET /api/teams/:teamId/members
 */
const getMembers = catchAsync(async (req, res) => {
  const { teamId } = req.params;
  
  const members = await membershipService.getTeamMembers(teamId);

  res.json({
    success: true,
    data: { members },
  });
});

/**
 * Update member role
 * @route PUT /api/teams/:teamId/members/:memberId
 */
const updateRole = catchAsync(async (req, res) => {
  const { teamId, memberId } = req.params;
  const { role } = req.body;

  const membership = await membershipService.updateRole(
    teamId,
    memberId,
    role,
    req.user.id
  );

  res.json({
    success: true,
    message: 'Member role updated successfully',
    data: { membership },
  });
});

/**
 * Remove member from team
 * @route DELETE /api/teams/:teamId/members/:memberId
 */
const removeMember = catchAsync(async (req, res) => {
  const { teamId, memberId } = req.params;

  await membershipService.removeMember(teamId, memberId, req.user.id);

  res.json({
    success: true,
    message: 'Member removed successfully',
  });
});

/**
 * Leave team
 * @route POST /api/teams/:teamId/leave
 */
const leaveTeam = catchAsync(async (req, res) => {
  const { teamId } = req.params;

  await membershipService.leaveTeam(req.user.id, teamId);

  res.json({
    success: true,
    message: 'Successfully left the team',
  });
});

module.exports = {
  getMembers,
  updateRole,
  removeMember,
  leaveTeam,
};