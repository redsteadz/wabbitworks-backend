const express = require('express');
const membershipController = require('./membership.controller');
const membershipValidation = require('./membership.validation');
const { validate, sanitize } = require('../../middleware/validation.middleware');
const { isAuthenticated, isTeamAdmin, isTeamMember } = require('../../middleware/auth.middleware');

const router = express.Router({ mergeParams: true });

// All routes require authentication
router.use(isAuthenticated);

// Get Team members
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
 *         description: Team ID
 *     responses:
 *       200:
 *         description: List of team members
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     members:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Member'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  '/',
  isTeamMember,
  membershipController.getMembers
);


// Add member (admin only)
/**
 * @swagger
 * /teams/{teamId}/members:
 *   post:
 *     summary: Add member to team (Admin/Owner only)
 *     tags: [Members]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Team ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddMemberRequest'
 *     responses:
 *       201:
 *         description: Member added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Member added successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     membership:
 *                       $ref: '#/components/schemas/Member'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: User not found with this email
 *       409:
 *         description: User is already a member of this team
 */
router.post(
  '/',
  sanitize,
  validate(membershipValidation.addMember),
  isTeamAdmin,
  membershipController.addMember
);

// Update member role (owner only - handled in service)
/**
 * @swagger
 * /teams/{teamId}/members/{memberId}:
 *   put:
 *     summary: Update member role (Owner only)
 *     tags: [Members]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Team ID
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Membership ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateRoleRequest'
 *     responses:
 *       200:
 *         description: Member role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Member role updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     membership:
 *                       $ref: '#/components/schemas/Member'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put(
  '/:memberId',
  sanitize,
  validate(membershipValidation.updateRole),
  isTeamMember,
  membershipController.updateRole
);

// Remove member (admin or self)
/**
 * @swagger
 * /teams/{teamId}/members/{memberId}:
 *   delete:
 *     summary: Remove member from team (Admin/Owner or self)
 *     tags: [Members]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Team ID
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Membership ID
 *     responses:
 *       200:
 *         description: Member removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Member removed successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete(
  '/:memberId',
  validate(membershipValidation.removeMember),
  isTeamMember,
  membershipController.removeMember
);

// Leave team
/**
 * @swagger
 * /teams/{teamId}/members/leave:
 *   post:
 *     summary: Leave team
 *     tags: [Members]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Team ID
 *     responses:
 *       200:
 *         description: Successfully left the team
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Successfully left the team
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Team owner cannot leave
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post(
  '/leave',
  validate(membershipValidation.leaveTeam),
  isTeamMember,
  membershipController.leaveTeam
);

module.exports = router;