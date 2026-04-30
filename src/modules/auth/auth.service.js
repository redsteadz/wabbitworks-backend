const userService = require('../users/user.service');
const membershipService = require('../memberships/membership.service');
const VerificationTokenModel = require('./verificationToken.model');
const PasswordResetTokenModel = require('./passwordResetToken.model');
const SessionModel = require('./session.model');
const emailService = require('../../services/email.service');
const ApiError = require('../../utils/ApiError');
const { hashPassword, comparePassword } = require('../../utils/bcrypt');
const { generateToken, generateVerificationCode, hashToken, createExpirationDate, isExpired } = require('../../utils/tokens');
const { TOKEN_TYPE } = require('../../utils/constants');
const env = require('../../config/env');
const { deleteStoredAvatar, isStoredAvatarUrl } = require('./avatar.storage');

/**
 * Register a new user
 */
const register = async (userData) => {
  // Check if email already exists
  const existingUser = await userService.findByEmail(userData.email);
  if (existingUser) {
    throw ApiError.conflict('Email already registered');
  }

  // Hash password
  const hashedPassword = await hashPassword(userData.password);

  // Create user
  const user = await userService.create({
    ...userData,
    password: hashedPassword,
    email_verified: false,
  });

  // Generate and send verification email
  await sendVerificationEmail(user);

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

/**
 * Get current user profile with teams
 */
const getProfile = async (userId) => {
  const user = await userService.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  // Get user's teams
  const memberships = await membershipService.findByUser(userId);

  const { password: _, ...userWithoutPassword } = user;
  return {
    ...userWithoutPassword,
    teams: memberships,
  };
};

/**
 * Persist the current user's avatar image
 */
const persistAvatar = async (userId, avatarUrl, previousAvatarUrl = null) => {
  const normalizedAvatarUrl = avatarUrl ?? null;

  const user = await userService.update(userId, {
    avatar_url: normalizedAvatarUrl,
  });

  if (
    previousAvatarUrl &&
    previousAvatarUrl !== normalizedAvatarUrl &&
    isStoredAvatarUrl(previousAvatarUrl)
  ) {
    try {
      await deleteStoredAvatar(previousAvatarUrl);
    } catch (error) {
      console.warn('Failed to delete old avatar file:', error.message);
    }
  }

  return user;
};

/**
 * Update the current user's avatar image
 */
const updateAvatar = async (userId, avatarUrl, previousAvatarUrl = null) => {
  await persistAvatar(userId, avatarUrl, previousAvatarUrl);
  return getProfile(userId);
};

/**
 * Send verification email
 */
const sendVerificationEmail = async (user) => {
  // Check rate limit - max 3 emails per hour
  const recentCount = await VerificationTokenModel.countRecentByUser(
    user.id,
    TOKEN_TYPE.EMAIL_VERIFICATION,
    60
  );
  
  if (recentCount >= 3) {
    throw ApiError.badRequest('Too many verification emails requested. Please try again later.');
  }

  // Generate token and code
  const token = generateToken();
  const verificationCode = generateVerificationCode();
  const tokenHash = hashToken(token);
  const expiresAt = createExpirationDate(env.tokens.verificationExpiresHours);

  // Delete any existing unused tokens
  await VerificationTokenModel.deleteByUserAndType(user.id, TOKEN_TYPE.EMAIL_VERIFICATION);

  // Save token to database
  await VerificationTokenModel.create({
    user_id: user.id,
    token: verificationCode, // Store code for manual entry
    token_hash: tokenHash,
    type: TOKEN_TYPE.EMAIL_VERIFICATION,
    expires_at: expiresAt,
  });

  // Build verification URL
  const verificationUrl = `${env.frontend.verifyEmailUrl}?token=${token}`;

  // Send email
  await emailService.sendVerificationEmail({
    to: user.email,
    firstName: user.first_name,
    verificationUrl,
    verificationCode,
    expiresInHours: env.tokens.verificationExpiresHours,
  });

  return { message: 'Verification email sent' };
};

/**
 * Verify email with token
 */
const verifyEmailWithToken = async (token) => {
  const tokenHash = hashToken(token);
  
  // Find valid token
  const verificationToken = await VerificationTokenModel.findValidByHash(tokenHash);
  
  if (!verificationToken) {
    throw ApiError.badRequest('Invalid or expired verification token');
  }

  // Get user
  const user = await userService.findByIdAll(verificationToken.user_id);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  if (user.email_verified) {
    throw ApiError.badRequest('Email is already verified');
  }

  // Mark token as used
  await VerificationTokenModel.markAsUsed(verificationToken.id);

  // Verify user's email
  const updatedUser = await userService.verifyEmail(user.id);

  // Send welcome email
  await emailService.sendWelcomeEmail({
    to: user.email,
    firstName: user.first_name,
  });

  const { password: _, ...userWithoutPassword } = updatedUser;
  return userWithoutPassword;
};

/**
 * Verify email with code
 */
const verifyEmailWithCode = async (userId, code) => {
  // Find valid token with matching code
  const verificationToken = await VerificationTokenModel.findLatestByUserAndType(
    userId,
    TOKEN_TYPE.EMAIL_VERIFICATION
  );

  if (!verificationToken) {
    throw ApiError.badRequest('No verification code found. Please request a new one.');
  }

  if (verificationToken.token !== code) {
    throw ApiError.badRequest('Invalid verification code');
  }

  if (isExpired(verificationToken.expires_at)) {
    throw ApiError.badRequest('Verification code has expired. Please request a new one.');
  }

  // Get user
  const user = await userService.findByIdAll(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  if (user.email_verified) {
    throw ApiError.badRequest('Email is already verified');
  }

  // Mark token as used
  await VerificationTokenModel.markAsUsed(verificationToken.id);

  // Verify user's email
  const updatedUser = await userService.verifyEmail(userId);

  // Send welcome email
  await emailService.sendWelcomeEmail({
    to: user.email,
    firstName: user.first_name,
  });

  const { password: _, ...userWithoutPassword } = updatedUser;
  return userWithoutPassword;
};

/**
 * Resend verification email
 */
const resendVerificationEmail = async (userId) => {
  const user = await userService.findByIdAll(userId);
  
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  if (user.email_verified) {
    throw ApiError.badRequest('Email is already verified');
  }

  return sendVerificationEmail(user);
};

/**
 * Initiate password reset
 */
const forgotPassword = async (email, ipAddress, userAgent) => {
  const user = await userService.findByEmail(email);
  
  // Always return success to prevent email enumeration
  if (!user) {
    return { message: 'If an account with that email exists, a password reset link has been sent.' };
  }

  // Check rate limit - max 3 reset emails per hour
  const recentCount = await PasswordResetTokenModel.countRecentByUser(user.id, 60);
  
  if (recentCount >= 3) {
    return { message: 'If an account with that email exists, a password reset link has been sent.' };
  }

  // Generate token
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = createExpirationDate(env.tokens.resetExpiresHours);

  // Delete any existing tokens
  await PasswordResetTokenModel.deleteByUser(user.id);

  // Save token
  await PasswordResetTokenModel.create({
    user_id: user.id,
    token_hash: tokenHash,
    expires_at: expiresAt,
    ip_address: ipAddress,
    user_agent: userAgent,
  });

  // Build reset URL
  const resetUrl = `${env.frontend.resetPasswordUrl}?token=${token}`;

  // Send email
  await emailService.sendPasswordResetEmail({
    to: user.email,
    firstName: user.first_name,
    resetUrl,
    expiresInHours: env.tokens.resetExpiresHours,
    ipAddress,
    userAgent,
    requestTime: new Date().toLocaleString(),
  });

  return { message: 'If an account with that email exists, a password reset link has been sent.' };
};

/**
 * Validate password reset token
 */
const validateResetToken = async (token) => {
  const tokenHash = hashToken(token);
  const resetToken = await PasswordResetTokenModel.findValidByHash(tokenHash);

  if (!resetToken) {
    throw ApiError.badRequest('Invalid or expired reset token');
  }

  return { valid: true };
};

/**
 * Reset password with token
 */
const resetPassword = async (token, newPassword, ipAddress, userAgent) => {
  const tokenHash = hashToken(token);
  const resetToken = await PasswordResetTokenModel.findValidByHash(tokenHash);

  if (!resetToken) {
    throw ApiError.badRequest('Invalid or expired reset token');
  }

  // Get user
  const user = await userService.findByIdAll(resetToken.user_id);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  // Hash new password
  const hashedPassword = await hashPassword(newPassword);

  // Update password
  await userService.updatePassword(user.id, hashedPassword);

  // Mark token as used
  await PasswordResetTokenModel.markAsUsed(resetToken.id);

  // Invalidate all sessions (force re-login)
  await SessionModel.deleteByUser(user.id);

  // Send notification email
  await emailService.sendPasswordChangedEmail({
    to: user.email,
    firstName: user.first_name,
    ipAddress,
    userAgent,
    changedAt: new Date().toLocaleString(),
  });

  return { message: 'Password has been reset successfully. Please log in with your new password.' };
};

/**
 * Change password (for logged-in users)
 */
const changePassword = async (userId, currentPassword, newPassword, ipAddress, userAgent) => {
  const user = await userService.findByIdAll(userId);
  
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  if (!user.password) {
    throw ApiError.badRequest('This account does not have a password yet. Use the password reset flow first.');
  }

  // Verify current password
  const isValidPassword = await comparePassword(currentPassword, user.password);
  if (!isValidPassword) {
    throw ApiError.badRequest('Current password is incorrect');
  }

  // Check if new password is same as current
  const isSamePassword = await comparePassword(newPassword, user.password);
  if (isSamePassword) {
    throw ApiError.badRequest('New password must be different from current password');
  }

  // Hash and update password
  const hashedPassword = await hashPassword(newPassword);
  await userService.updatePassword(userId, hashedPassword);

  // Send notification email
  await emailService.sendPasswordChangedEmail({
    to: user.email,
    firstName: user.first_name,
    ipAddress,
    userAgent,
    changedAt: new Date().toLocaleString(),
  });

  return { message: 'Password changed successfully' };
};

/**
 * Initiate email change
 */
const changeEmail = async (userId, newEmail, password) => {
  const user = await userService.findByIdAll(userId);
  
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  if (!user.password) {
    throw ApiError.badRequest('This account does not have a password yet. Use the password reset flow first.');
  }

  // Verify password
  const isValidPassword = await comparePassword(password, user.password);
  if (!isValidPassword) {
    throw ApiError.badRequest('Password is incorrect');
  }

  // Check if new email is same as current
  if (user.email.toLowerCase() === newEmail.toLowerCase()) {
    throw ApiError.badRequest('New email must be different from current email');
  }

  // Check if email is already taken
  const emailTaken = await userService.emailExists(newEmail, userId);
  if (emailTaken) {
    throw ApiError.conflict('This email is already registered');
  }

  // Check rate limit
  const recentCount = await VerificationTokenModel.countRecentByUser(
    userId,
    TOKEN_TYPE.EMAIL_CHANGE,
    60
  );
  
  if (recentCount >= 3) {
    throw ApiError.badRequest('Too many email change requests. Please try again later.');
  }

  // Generate token
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = createExpirationDate(env.tokens.verificationExpiresHours);

  // Delete any existing email change tokens
  await VerificationTokenModel.deleteByUserAndType(userId, TOKEN_TYPE.EMAIL_CHANGE);

  // Save token
  await VerificationTokenModel.create({
    user_id: userId,
    token: token.substring(0, 6).toUpperCase(), // Short code for display
    token_hash: tokenHash,
    type: TOKEN_TYPE.EMAIL_CHANGE,
    new_email: newEmail,
    expires_at: expiresAt,
  });

  // Update pending email
  await userService.setPendingEmail(userId, newEmail);

  // Build confirmation URL
  const confirmUrl = `${env.frontend.verifyEmailUrl}?token=${token}&type=email-change`;

  // Send verification to NEW email
  await emailService.sendEmailChangeVerification({
    to: newEmail,
    firstName: user.first_name,
    newEmail,
    confirmUrl,
    expiresInHours: env.tokens.verificationExpiresHours,
  });

  return { message: 'Verification email sent to your new email address' };
};

/**
 * Confirm email change with token
 */
const confirmEmailChange = async (token) => {
  const tokenHash = hashToken(token);
  
  // Find valid token
  const verificationToken = await VerificationTokenModel.findValidByHash(tokenHash);
  
  if (!verificationToken || verificationToken.type !== TOKEN_TYPE.EMAIL_CHANGE) {
    throw ApiError.badRequest('Invalid or expired verification token');
  }

  if (!verificationToken.new_email) {
    throw ApiError.badRequest('Invalid email change request');
  }

  // Check if new email is still available
  const emailTaken = await userService.emailExists(verificationToken.new_email, verificationToken.user_id);
  if (emailTaken) {
    await VerificationTokenModel.markAsUsed(verificationToken.id);
    throw ApiError.conflict('This email is no longer available');
  }

  // Update email
  const updatedUser = await userService.updateEmail(verificationToken.user_id, verificationToken.new_email);

  // Mark token as used
  await VerificationTokenModel.markAsUsed(verificationToken.id);

  const { password: _, ...userWithoutPassword } = updatedUser;
  return userWithoutPassword;
};

/**
 * Get user sessions
 */
const getSessions = async (userId, currentSessionId) => {
  const sessions = await SessionModel.findByUser(userId);
  
  return sessions.map((session) => {
    const parsed = SessionModel.parseSessionData(session);
    return {
      ...parsed,
      isCurrent: session.sid === currentSessionId,
    };
  });
};

/**
 * Delete a specific session
 */
const deleteSession = async (userId, sessionId, currentSessionId) => {
  const session = await SessionModel.findById(sessionId);
  
  if (!session) {
    throw ApiError.notFound('Session not found');
  }

  if (session.user_id !== userId) {
    throw ApiError.forbidden('You can only delete your own sessions');
  }

  if (sessionId === currentSessionId) {
    throw ApiError.badRequest('Cannot delete current session. Use logout instead.');
  }

  await SessionModel.deleteById(sessionId);

  return { message: 'Session terminated successfully' };
};

/**
 * Logout from all devices
 */
const logoutAll = async (userId, currentSessionId, keepCurrent = false) => {
  if (keepCurrent) {
    await SessionModel.deleteByUserExcept(userId, currentSessionId);
    return { message: 'Logged out from all other devices' };
  }
  
  await SessionModel.deleteByUser(userId);
  return { message: 'Logged out from all devices' };
};

/**
 * Refresh session (extend expiry)
 */
const refreshSession = async (sessionId) => {
  const session = await SessionModel.findById(sessionId);
  
  if (!session) {
    throw ApiError.notFound('Session not found');
  }

  // Update last activity
  await SessionModel.updateMetadata(sessionId, {
    last_activity_at: new Date(),
  });

  return { message: 'Session refreshed' };
};

module.exports = {
  register,
  getProfile,
  persistAvatar,
  updateAvatar,
  sendVerificationEmail,
  verifyEmailWithToken,
  verifyEmailWithCode,
  resendVerificationEmail,
  forgotPassword,
  validateResetToken,
  resetPassword,
  changePassword,
  changeEmail,
  confirmEmailChange,
  getSessions,
  deleteSession,
  logoutAll,
  refreshSession,
};
