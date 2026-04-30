const express = require('express');
const membershipController = require('./membership.controller');
const membershipValidation = require('./membership.validation');
const { validate, sanitize } = require('../../middleware/validation.middleware');
const { isAuthenticated, isTeamAdmin, isTeamMember, isTeamOwner } = require('../../middleware/auth.middleware');

const router = express.Router({ mergeParams: true });

// All routes require authentication
router.use(isAuthenticated);

/**
 * @swagger
 * /teams/{teamId}/members:
 *   get:
 *     summary: Get team members
 *     tags: [Members, Teams]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of team members
 */
router.get(
  '/',
  isTeamMember,
  membershipController.getMembers
);

// NOTE: POST route removed - use invitations instead

/**
 * @swagger
 * /teams/{teamId}/members/{memberId}:
 *   put:
 *     summary: Update member role (Owner only)
 *     tags: [Members]
 *     security:
 *       - sessionAuth: []
 */
router.put(
  '/:memberId',
  sanitize,
  validate(membershipValidation.updateRole),
  isTeamOwner,
  membershipController.updateRole
);

/**
 * @swagger
 * /teams/{teamId}/members/{memberId}:
 *   delete:
 *     summary: Remove member from team (Admin/Owner or self)
 *     tags: [Members]
 *     security:
 *       - sessionAuth: []
 */
router.delete(
  '/:memberId',
  validate(membershipValidation.removeMember),
  isTeamMember,
  membershipController.removeMember
);

/**
 * @swagger
 * /teams/{teamId}/members/leave:
 *   post:
 *     summary: Leave team
 *     tags: [Members]
 *     security:
 *       - sessionAuth: []
 */
router.post(
  '/leave',
  validate(membershipValidation.leaveTeam),
  isTeamMember,
  membershipController.leaveTeam
);

module.exports = router;