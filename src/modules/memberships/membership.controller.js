const membershipService = require('./membership.service');
const catchAsync = require('../../utils/catchAsync');

/**
 * Get team members
 * * @route GET /api/teams/:teamId/members
 */
const getMembers = async (req, res, next) => {

  try {
    const { teamId } = req.params;
    const userId = req.user.id;
    
    const members = await membershipService.getTeamMembers(teamId, userId);

    res.json(
      ApiResponse.success('Members retrieved successfully', {
        members,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Add member to team
 * @route POST /api/teams/:teamId/members
 */
const addMember = catchAsync(async (req, res) => {
  const { teamId } = req.params;
  const { email, role } = req.body;

  const membership = await membershipService.addMember(
    teamId,
    email,
    role,
    req.user.id
  );

  res.status(201).json({
    success: true,
    message: 'Member added successfully',
    data: { membership },
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
    memberId,
    role,
    req.user.id,
    teamId
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

  await membershipService.removeMember(memberId, req.user.id, teamId);

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
  addMember,
  updateRole,
  removeMember,
  leaveTeam,
};