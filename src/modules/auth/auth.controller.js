const passport = require('passport');
const authService = require('./auth.service');
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
    
    // Save session before sending response
    req.session.save((saveErr) => {
      if (saveErr) {
        throw ApiError.internal('Error saving session');
      }

      res.status(201).json({
        success: true,
        message: 'Registration successful',
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

      // Explicitly save the session before responding
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

module.exports = {
  register,
  login,
  logout,
  getMe,
  getStatus,
};