const express = require('express');
const passport = require('passport');
const authController = require('./auth.controller');
const authValidation = require('./auth.validation');
const { avatarUpload } = require('./avatar.storage');
const { validate, sanitize } = require('../../middleware/validation.middleware');
const { isAuthenticated } = require('../../middleware/auth.middleware');
const { authLimiter } = require('../../middleware/rateLimiter.middleware');

const router = express.Router();

// ============================================
// PUBLIC ROUTES (with rate limiting)
// ============================================

/**
 * @swagger
 * /auth/google:
 *   get:
 *     summary: Initiate Google OAuth login
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirect to Google login page
 */
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account',
  })
);

/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirect to frontend after login
 */
router.get('/google/callback', authController.googleCallback);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Registration successful
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: Email already registered
 */
router.post(
  '/register',
  authLimiter,
  sanitize,
  validate(authValidation.register),
  authController.register
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post(
  '/login',
  authLimiter,
  sanitize,
  validate(authValidation.login),
  authController.login
);

/**
 * @swagger
 * /auth/status:
 *   get:
 *     summary: Check authentication status
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Authentication status
 */
router.get('/status', authController.getStatus);

// ============================================
// EMAIL VERIFICATION ROUTES
// ============================================

/**
 * @swagger
 * /auth/verify-email:
 *   get:
 *     summary: Verify email with token (from email link)
 *     tags: [Auth - Email Verification]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [email-change]
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 */
router.get(
  '/verify-email',
  validate(authValidation.verifyEmailToken),
  authController.verifyEmailToken
);

/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     summary: Verify email with code (manual entry)
 *     tags: [Auth - Email Verification]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid verification code
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
  '/verify-email',
  authLimiter,
  isAuthenticated,
  sanitize,
  validate(authValidation.verifyEmailCode),
  authController.verifyEmailCode
);

/**
 * @swagger
 * /auth/resend-verification:
 *   post:
 *     summary: Resend verification email
 *     tags: [Auth - Email Verification]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Verification email sent
 *       400:
 *         description: Email already verified or rate limited
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
  '/resend-verification',
  authLimiter,
  isAuthenticated,
  authController.resendVerification
);

// ============================================
// PASSWORD RESET ROUTES
// ============================================

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset email
 *     tags: [Auth - Password Reset]
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
 *     responses:
 *       200:
 *         description: Reset email sent (always returns success for security)
 */
router.post(
  '/forgot-password',
  authLimiter,
  sanitize,
  validate(authValidation.forgotPassword),
  authController.forgotPassword
);

/**
 * @swagger
 * /auth/reset-password:
 *   get:
 *     summary: Validate password reset token
 *     tags: [Auth - Password Reset]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Token is valid
 *       400:
 *         description: Invalid or expired token
 */
router.get(
  '/reset-password',
  validate(authValidation.validateResetToken),
  authController.validateResetToken
);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Auth - Password Reset]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid or expired token
 */
router.post(
  '/reset-password',
  authLimiter,
  sanitize,
  validate(authValidation.resetPassword),
  authController.resetPassword
);

// ============================================
// AUTHENTICATED ROUTES
// ============================================

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout current session
 *     tags: [Auth]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/logout', isAuthenticated, authController.logout);

/**
 * @swagger
 * /auth/logout-all:
 *   post:
 *     summary: Logout from all devices
 *     tags: [Auth - Session Management]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               keepCurrent:
 *                 type: boolean
 *                 default: false
 *                 description: Keep the current session active
 *     responses:
 *       200:
 *         description: Logged out from all devices
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
  '/logout-all',
  isAuthenticated,
  validate(authValidation.logoutAll),
  authController.logoutAll
);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh session (extend expiry)
 *     tags: [Auth - Session Management]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Session refreshed
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/refresh', isAuthenticated, authController.refreshSession);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/me', isAuthenticated, authController.getMe);

/**
 * @swagger
 * /auth/me/avatar:
 *   patch:
 *     summary: Update current user's avatar image
 *     tags: [Auth]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/UpdateAvatarRequest'
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateAvatarRequest'
 *     responses:
 *       200:
 *         description: Avatar updated successfully
 *       400:
 *         description: Invalid avatar file or URL
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.patch(
  '/me/avatar',
  isAuthenticated,
  avatarUpload.single('avatar'),
  sanitize,
  validate(authValidation.updateAvatar),
  authController.updateAvatar
);

/**
 * @swagger
 * /auth/me/avatar:
 *   delete:
 *     summary: Remove current user's avatar image
 *     tags: [Auth]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Avatar removed successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.delete('/me/avatar', isAuthenticated, authController.removeAvatar);

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change password (authenticated user)
 *     tags: [Auth - Password Management]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Current password incorrect
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
  '/change-password',
  isAuthenticated,
  sanitize,
  validate(authValidation.changePassword),
  authController.changePassword
);

/**
 * @swagger
 * /auth/change-email:
 *   post:
 *     summary: Initiate email change
 *     tags: [Auth - Email Management]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newEmail
 *               - password
 *             properties:
 *               newEmail:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Verification email sent to new address
 *       400:
 *         description: Password incorrect or email same as current
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       409:
 *         description: Email already registered
 */
router.post(
  '/change-email',
  isAuthenticated,
  sanitize,
  validate(authValidation.changeEmail),
  authController.changeEmail
);

// ============================================
// SESSION MANAGEMENT ROUTES
// ============================================

/**
 * @swagger
 * /auth/sessions:
 *   get:
 *     summary: Get all active sessions
 *     tags: [Auth - Session Management]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: List of active sessions
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
 *                     sessions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           sid:
 *                             type: string
 *                           ipAddress:
 *                             type: string
 *                           userAgent:
 *                             type: string
 *                           deviceType:
 *                             type: string
 *                           browser:
 *                             type: string
 *                           os:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           lastActivityAt:
 *                             type: string
 *                             format: date-time
 *                           isCurrent:
 *                             type: boolean
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/sessions', isAuthenticated, authController.getSessions);

/**
 * @swagger
 * /auth/sessions/{sessionId}:
 *   delete:
 *     summary: Terminate a specific session
 *     tags: [Auth - Session Management]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session terminated
 *       400:
 *         description: Cannot delete current session
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Session not found
 */
router.delete(
  '/sessions/:sessionId',
  isAuthenticated,
  validate(authValidation.deleteSession),
  authController.deleteSession
);

module.exports = router;
