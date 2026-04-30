const invitationService = require('./invitation.service');
const catchAsync = require('../../utils/catchAsync');

/**
 * Create team invitation
 * @route POST /api/teams/:teamId/invitations
 */
const create = catchAsync(async (req, res) => {
  const { teamId } = req.params;
  const { email, role, message } = req.body;

  const invitation = await invitationService.createInvitation(
    teamId,
    email,
    role,
    req.user.id,
    message
  );

  res.status(201).json({
    success: true,
    message: 'Invitation sent successfully',
    data: { invitation },
  });
});

/**
 * Get invitation by ID
 * @route GET /api/invitations/:id
 */
const getById = catchAsync(async (req, res) => {
  const invitation = await invitationService.getById(req.params.id, req.user.id);

  res.json({
    success: true,
    data: { invitation },
  });
});

/**
 * Get received invitations (for current user)
 * @route GET /api/invitations/received
 */
const getReceived = catchAsync(async (req, res) => {
  const invitations = await invitationService.getReceivedInvitations(req.user.id, req.query);

  res.json({
    success: true,
    data: { invitations },
  });
});

/**
 * Get sent invitations (by current user)
 * @route GET /api/invitations/sent
 */
const getSent = catchAsync(async (req, res) => {
  const invitations = await invitationService.getSentInvitations(req.user.id, req.query);

  res.json({
    success: true,
    data: { invitations },
  });
});

/**
 * Get team invitations
 * @route GET /api/teams/:teamId/invitations
 */
const getTeamInvitations = catchAsync(async (req, res) => {
  const invitations = await invitationService.getTeamInvitations(
    req.params.teamId,
    req.user.id,
    req.query
  );

  res.json({
    success: true,
    data: { invitations },
  });
});

/**
 * Get pending invitation count
 * @route GET /api/invitations/pending/count
 */
const getPendingCount = catchAsync(async (req, res) => {
  const result = await invitationService.getPendingCount(req.user.id);

  res.json({
    success: true,
    data: result,
  });
});

/**
 * Accept invitation
 * @route POST /api/invitations/:id/accept
 */
const accept = catchAsync(async (req, res) => {
  const result = await invitationService.acceptInvitation(req.params.id, req.user.id);

  res.json({
    success: true,
    message: 'Invitation accepted successfully',
    data: result,
  });
});

/**
 * Decline invitation
 * @route POST /api/invitations/:id/decline
 */
const decline = catchAsync(async (req, res) => {
  const invitation = await invitationService.declineInvitation(req.params.id, req.user.id);

  res.json({
    success: true,
    message: 'Invitation declined',
    data: { invitation },
  });
});

/**
 * Cancel invitation
 * @route POST /api/invitations/:id/cancel
 */
const cancel = catchAsync(async (req, res) => {
  const invitation = await invitationService.cancelInvitation(req.params.id, req.user.id);

  res.json({
    success: true,
    message: 'Invitation cancelled',
    data: { invitation },
  });
});

/**
 * Resend invitation
 * @route POST /api/invitations/:id/resend
 */
const resend = catchAsync(async (req, res) => {
  const invitation = await invitationService.resendInvitation(req.params.id, req.user.id);

  res.json({
    success: true,
    message: 'Invitation resent successfully',
    data: { invitation },
  });
});

/**
 * Accept invitation from email link (public endpoint)
 * @route GET /api/invitations/public/:id/accept
 * No authentication required - for email links
 */
const acceptPublic = catchAsync(async (req, res) => {
  const result = await invitationService.acceptInvitationPublic(req.params.id);

  // Redirect to confirmation page
  const frontendUrl = require('../../config/env').frontend.url;
  res.redirect(`${frontendUrl}/invitations/confirmation?status=accepted`);
});

/**
 * Decline invitation from email link (public endpoint)
 * @route GET /api/invitations/public/:id/decline
 * No authentication required - for email links
 */
const declinePublic = catchAsync(async (req, res) => {
  const invitation = await invitationService.declineInvitationPublic(req.params.id);

  // Redirect to confirmation page
  const frontendUrl = require('../../config/env').frontend.url;
  res.redirect(`${frontendUrl}/invitations/confirmation?status=declined`);
});

module.exports = {
  create,
  getById,
  getReceived,
  getSent,
  getTeamInvitations,
  getPendingCount,
  accept,
  decline,
  cancel,
  resend,
  acceptPublic,
  declinePublic,
};