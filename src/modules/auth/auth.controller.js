const passport = require('passport');
const authService = require('./auth.service');
const { storeAvatarFile } = require('./avatar.storage');
const catchAsync = require('../../utils/catchAsync');
const ApiError = require('../../utils/ApiError');

/**
 * Register a new user
 * @route POST /api/auth/register
 */
const register = catchAsync(async (req, res) => {
  const user = await authService.register(req.body);

  // Automatically log in the user after registration
  req.login(user, (err) => {
    if (err) {
      throw ApiError.internal('Error logging in after registration');
    }

    // Save session with metadata
    req.session.userId = user.id;
    
    req.session.save((saveErr) => {
      if (saveErr) {
        throw ApiError.internal('Error saving session');
      }

      res.status(201).json({
        success: true,
        message: 'Registration successful. Please check your email to verify your account.',
        data: { user },
      });
    });
  });
});

/**
 * Login user
 * @route POST /api/auth/login
 */
const login = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return next(ApiError.unauthorized(info?.message || 'Invalid credentials'));
    }

    req.login(user, (loginErr) => {
      if (loginErr) {
        return next(loginErr);
      }

      // Save session with metadata
      req.session.userId = user.id;

      req.session.save((saveErr) => {
        if (saveErr) {
          return next(saveErr);
        }

        res.json({
          success: true,
          message: 'Login successful',
          data: { user },
        });
      });
    });
  })(req, res, next);
};

/**
 * Google OAuth Callback
 * @route GET /api/auth/google/callback
 */
const googleCallback = (req, res, next) => {
  passport.authenticate('google', (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/login?error=auth_failed`);
    }

    req.login(user, (loginErr) => {
      if (loginErr) {
        return next(loginErr);
      }

      // Save session with metadata
      req.session.userId = user.id;

      req.session.save((saveErr) => {
        if (saveErr) {
          return next(saveErr);
        }

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(frontendUrl);
      });
    });
  })(req, res, next);
};

/**
 * Logout user
 * @route POST /api/auth/logout
 */
const logout = catchAsync(async (req, res) => {
  req.logout((err) => {
    if (err) {
      throw ApiError.internal('Error logging out');
    }

    req.session.destroy((sessionErr) => {
      if (sessionErr) {
        console.error('Session destruction error:', sessionErr);
      }

      res.clearCookie('sessionId');
      res.json({
        success: true,
        message: 'Logout successful',
      });
    });
  });
});

/**
 * Logout from all devices
 * @route POST /api/auth/logout-all
 */
const logoutAll = catchAsync(async (req, res) => {
  const keepCurrent = req.body.keepCurrent === true;
  const result = await authService.logoutAll(req.user.id, req.sessionID, keepCurrent);

  if (!keepCurrent) {
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
      }
      req.session.destroy();
      res.clearCookie('sessionId');
    });
  }

  res.json({
    success: true,
    message: result.message,
  });
});

/**
 * Get current user profile
 * @route GET /api/auth/me
 */
const getMe = catchAsync(async (req, res) => {
  const profile = await authService.getProfile(req.user.id);

  res.json({
    success: true,
    data: { user: profile },
  });
});

/**
 * Update current user's avatar image
 * @route PATCH /api/auth/me/avatar
 */
const updateAvatar = catchAsync(async (req, res) => {
  const { avatar_url } = req.body;

  let nextAvatarUrl = avatar_url;
  let uploadedAvatar = null;

  if (req.file) {
    uploadedAvatar = await storeAvatarFile(req.file, req);
    nextAvatarUrl = uploadedAvatar.avatarUrl;
  }

  if (!nextAvatarUrl) {
    throw ApiError.badRequest('Upload an avatar image file or provide avatar_url');
  }

  try {
    const profile = await authService.updateAvatar(req.user.id, nextAvatarUrl, req.user.avatar_url);

    res.json({
      success: true,
      message: 'Avatar updated successfully',
      data: { user: profile },
    });
  } catch (error) {
    if (uploadedAvatar) {
      try {
        await authService.persistAvatar(req.user.id, req.user.avatar_url, uploadedAvatar.avatarUrl);
      } catch (rollbackError) {
        console.warn('Failed to roll back avatar upload:', rollbackError.message);
      }
    }

    throw error;
  }
});

/**
 * Remove current user's avatar image
 * @route DELETE /api/auth/me/avatar
 */
const removeAvatar = catchAsync(async (req, res) => {
  const profile = await authService.updateAvatar(req.user.id, null, req.user.avatar_url);

  res.json({
    success: true,
    message: 'Avatar removed successfully',
    data: { user: profile },
  });
});

/**
 * Check authentication status
 * @route GET /api/auth/status
 */
const getStatus = catchAsync(async (req, res) => {
  res.json({
    success: true,
    data: {
      isAuthenticated: req.isAuthenticated(),
      user: req.user || null,
    },
  });
});

/**
 * Send verification email
 * @route POST /api/auth/verify-email
 */
const sendVerificationEmail = catchAsync(async (req, res) => {
  // For sending new verification (user must be logged in but not verified)
  if (req.user) {
    const result = await authService.resendVerificationEmail(req.user.id);
    return res.json({
      success: true,
      message: result.message,
    });
  }
  
  // If token is provided in body, verify with code
  if (req.body.code) {
    throw ApiError.unauthorized('Please log in to verify with code');
  }

  throw ApiError.unauthorized('Please log in to request verification email');
});

/**
 * Verify email with token (from email link)
 * @route GET /api/auth/verify-email
 */
const verifyEmailToken = catchAsync(async (req, res) => {
  const { token, type } = req.query;

  if (!token) {
    throw ApiError.badRequest('Verification token is required');
  }

  let user;
  if (type === 'email-change') {
    user = await authService.confirmEmailChange(token);
  } else {
    user = await authService.verifyEmailWithToken(token);
  }

  res.json({
    success: true,
    message: type === 'email-change' ? 'Email changed successfully' : 'Email verified successfully',
    data: { user },
  });
});

/**
 * Verify email with code (manual entry)
 * @route POST /api/auth/verify-email/code
 */
const verifyEmailCode = catchAsync(async (req, res) => {
  if (!req.user) {
    throw ApiError.unauthorized('Please log in to verify your email');
  }

  const { code } = req.body;
  
  if (!code) {
    throw ApiError.badRequest('Verification code is required');
  }

  const user = await authService.verifyEmailWithCode(req.user.id, code);

  res.json({
    success: true,
    message: 'Email verified successfully',
    data: { user },
  });
});

/**
 * Resend verification email
 * @route POST /api/auth/resend-verification
 */
const resendVerification = catchAsync(async (req, res) => {
  if (!req.user) {
    throw ApiError.unauthorized('Please log in to resend verification email');
  }

  const result = await authService.resendVerificationEmail(req.user.id);

  res.json({
    success: true,
    message: result.message,
  });
});

/**
 * Forgot password - initiate reset
 * @route POST /api/auth/forgot-password
 */
const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'];

  const result = await authService.forgotPassword(email, ipAddress, userAgent);

  res.json({
    success: true,
    message: result.message,
  });
});

/**
 * Validate reset token
 * @route GET /api/auth/reset-password
 */
const validateResetToken = catchAsync(async (req, res) => {
  const { token } = req.query;

  if (!token) {
    throw ApiError.badRequest('Reset token is required');
  }

  const result = await authService.validateResetToken(token);

  res.json({
    success: true,
    data: result,
  });
});

/**
 * Reset password with token
 * @route POST /api/auth/reset-password
 */
const resetPassword = catchAsync(async (req, res) => {
  const { token, password } = req.body;
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'];

  if (!token) {
    throw ApiError.badRequest('Reset token is required');
  }

  const result = await authService.resetPassword(token, password, ipAddress, userAgent);

  res.json({
    success: true,
    message: result.message,
  });
});

/**
 * Change password (authenticated)
 * @route POST /api/auth/change-password
 */
const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'];

  const result = await authService.changePassword(
    req.user.id,
    currentPassword,
    newPassword,
    ipAddress,
    userAgent
  );

  res.json({
    success: true,
    message: result.message,
  });
});

/**
 * Change email - initiate
 * @route POST /api/auth/change-email
 */
const changeEmail = catchAsync(async (req, res) => {
  const { newEmail, password } = req.body;

  const result = await authService.changeEmail(req.user.id, newEmail, password);

  res.json({
    success: true,
    message: result.message,
  });
});

/**
 * Get active sessions
 * @route GET /api/auth/sessions
 */
const getSessions = catchAsync(async (req, res) => {
  const sessions = await authService.getSessions(req.user.id, req.sessionID);

  res.json({
    success: true,
    data: { sessions },
  });
});

/**
 * Delete a session
 * @route DELETE /api/auth/sessions/:sessionId
 */
const deleteSession = catchAsync(async (req, res) => {
  const { sessionId } = req.params;
  
  const result = await authService.deleteSession(req.user.id, sessionId, req.sessionID);

  res.json({
    success: true,
    message: result.message,
  });
});

/**
 * Refresh session
 * @route POST /api/auth/refresh
 */
const refreshSession = catchAsync(async (req, res) => {
  const result = await authService.refreshSession(req.sessionID);

  // Touch the session to extend expiry
  req.session.touch();
  
  req.session.save((err) => {
    if (err) {
      console.error('Session save error:', err);
    }
  });

  res.json({
    success: true,
    message: result.message,
  });
});

module.exports = {
  register,
  login,
  logout,
  logoutAll,
  getMe,
  getStatus,
  sendVerificationEmail,
  verifyEmailToken,
  verifyEmailCode,
  resendVerification,
  forgotPassword,
  validateResetToken,
  resetPassword,
  changePassword,
  changeEmail,
  updateAvatar,
  removeAvatar,
  getSessions,
  deleteSession,
  refreshSession,
  googleCallback,
};
