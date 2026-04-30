const express = require('express');
const invitationController = require('./invitation.controller');
const invitationValidation = require('./invitation.validation');
const { validate, sanitize } = require('../../middleware/validation.middleware');
const { isAuthenticated, isTeamAdmin } = require('../../middleware/auth.middleware');

const router = express.Router({ mergeParams: true });

/**
 * @swagger
 * /invitations/public/{id}/accept:
 *   get:
 *     summary: Accept invitation from email link (public - no auth required)
 *     tags: [Invitations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Invitation ID
 *     responses:
 *       200:
 *         description: Invitation accepted successfully
 *       400:
 *         description: Invitation expired or already responded
 *       404:
 *         description: Invitation not found
 */
router.get('/public/:id/accept', invitationController.acceptPublic);

/**
 * @swagger
 * /invitations/public/{id}/decline:
 *   get:
 *     summary: Decline invitation from email link (public - no auth required)
 *     tags: [Invitations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Invitation ID
 *     responses:
 *       200:
 *         description: Invitation declined successfully
 *       400:
 *         description: Invitation expired or already responded
 *       404:
 *         description: Invitation not found
 */
router.get('/public/:id/decline', invitationController.declinePublic);

// All routes below require authentication
router.use(isAuthenticated);

/**
 * @swagger
 * /invitations/pending/count:
 *   get:
 *     summary: Get pending invitation count
 *     tags: [Invitations]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Pending count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/pending/count', invitationController.getPendingCount);

/**
 * @swagger
 * /invitations/received:
 *   get:
 *     summary: Get received invitations
 *     tags: [Invitations]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, accepted, declined, cancelled]
 *         description: Filter by invitation status
 *     responses:
 *       200:
 *         description: List of received invitations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     invitations:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  '/received',
  validate(invitationValidation.getReceived),
  invitationController.getReceived
);

/**
 * @swagger
 * /invitations/sent:
 *   get:
 *     summary: Get sent invitations
 *     tags: [Invitations]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, accepted, declined, cancelled]
 *         description: Filter by invitation status
 *       - in: query
 *         name: team_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by team ID
 *     responses:
 *       200:
 *         description: List of sent invitations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     invitations:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  '/sent',
  validate(invitationValidation.getSent),
  invitationController.getSent
);

/**
 * @swagger
 * /invitations/{id}:
 *   get:
 *     summary: Get invitation by ID
 *     tags: [Invitations]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Invitation ID
 *     responses:
 *       200:
 *         description: Invitation details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     invitation:
 *                       type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  '/:id',
  validate(invitationValidation.getById),
  invitationController.getById
);

/**
 * @swagger
 * /invitations/{id}/accept:
 *   post:
 *     summary: Accept invitation
 *     tags: [Invitations]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Invitation ID
 *     responses:
 *       200:
 *         description: Invitation accepted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Invitation expired or already responded
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post(
  '/:id/accept',
  validate(invitationValidation.getById),
  invitationController.accept
);

/**
 * @swagger
 * /invitations/{id}/decline:
 *   post:
 *     summary: Decline invitation
 *     tags: [Invitations]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Invitation ID
 *     responses:
 *       200:
 *         description: Invitation declined
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Invitation expired or already responded
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post(
  '/:id/decline',
  validate(invitationValidation.getById),
  invitationController.decline
);

/**
 * @swagger
 * /invitations/{id}/cancel:
 *   post:
 *     summary: Cancel invitation (inviter/admin only)
 *     tags: [Invitations]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Invitation ID
 *     responses:
 *       200:
 *         description: Invitation cancelled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Invitation already responded
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post(
  '/:id/cancel',
  validate(invitationValidation.getById),
  invitationController.cancel
);

/**
 * @swagger
 * /invitations/{id}/resend:
 *   post:
 *     summary: Resend invitation
 *     tags: [Invitations]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Invitation ID
 *     responses:
 *       200:
 *         description: Invitation resent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Invitation already responded
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post(
  '/:id/resend',
  validate(invitationValidation.getById),
  invitationController.resend
);

module.exports = router;