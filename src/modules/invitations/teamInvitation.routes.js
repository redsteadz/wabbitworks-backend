const express = require('express');
const invitationController = require('./invitation.controller');
const invitationValidation = require('./invitation.validation');
const { validate, sanitize } = require('../../middleware/validation.middleware');
const { isAuthenticated, isTeamAdmin } = require('../../middleware/auth.middleware');

const router = express.Router({ mergeParams: true });

// All routes require authentication
router.use(isAuthenticated);

/**
 * @swagger
 * /teams/{teamId}/invitations:
 *   get:
 *     summary: Get all invitations for a team
 *     tags: [Invitations, Teams]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, accepted, declined, cancelled]
 *     responses:
 *       200:
 *         description: List of team invitations
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get(
  '/',
  validate(invitationValidation.getTeamInvitations),
  isTeamAdmin,
  invitationController.getTeamInvitations
);

/**
 * @swagger
 * /teams/{teamId}/invitations:
 *   post:
 *     summary: Create team invitation (Admin/Owner only)
 *     tags: [Invitations, Teams]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               role:
 *                 type: string
 *                 enum: [admin, member]
 *                 default: member
 *               message:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       201:
 *         description: Invitation sent successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: User not found
 *       409:
 *         description: User already member or invitation pending
 */
router.post(
  '/',
  sanitize,
  validate(invitationValidation.create),
  isTeamAdmin,
  invitationController.create
);

module.exports = router;