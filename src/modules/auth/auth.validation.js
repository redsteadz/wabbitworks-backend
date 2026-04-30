const Joi = require('joi');

// Password validation regex
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
// Strong password requirements
const passwordMessage = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
const avatarUrlSchema = Joi.string()
  .trim()
  .uri({ scheme: ['http', 'https'] })
  .max(500)
  .messages({
    'string.uri': 'Avatar URL must be a valid http or https URL',
    'string.max': 'Avatar URL must not exceed 500 characters',
  });

const register = {
  body: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
    password: Joi.string()
      .min(8)
      .max(128)
      .pattern(passwordRegex)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.max': 'Password must not exceed 128 characters',
        'string.pattern.base': passwordMessage,
        'any.required': 'Password is required',
      }),
    first_name: Joi.string().min(1).max(100).trim().required().messages({
      'string.min': 'First name is required',
      'string.max': 'First name must not exceed 100 characters',
      'any.required': 'First name is required',
    }),
    last_name: Joi.string().min(1).max(100).trim().required().messages({
      'string.min': 'Last name is required',
      'string.max': 'Last name must not exceed 100 characters',
      'any.required': 'Last name is required',
    }),
    avatar_url: avatarUrlSchema.allow(null).optional().messages({
      'string.uri': 'Avatar URL must be a valid http or https URL',
      'string.max': 'Avatar URL must not exceed 500 characters',
    }),
  }),
};

const login = {
  body: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required',
    }),
  }),
};

const verifyEmailCode = {
  body: Joi.object({
    code: Joi.string().length(6).pattern(/^\d+$/).required().messages({
      'string.length': 'Verification code must be 6 digits',
      'string.pattern.base': 'Verification code must contain only numbers',
      'any.required': 'Verification code is required',
    }),
  }),
};

const verifyEmailToken = {
  query: Joi.object({
    token: Joi.string().required().messages({
      'any.required': 'Verification token is required',
    }),
    type: Joi.string().valid('email-change').optional(),
  }),
};

const forgotPassword = {
  body: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
  }),
};

const resetPassword = {
  body: Joi.object({
    token: Joi.string().required().messages({
      'any.required': 'Reset token is required',
    }),
    password: Joi.string()
      .min(8)
      .max(128)
      .pattern(passwordRegex)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.max': 'Password must not exceed 128 characters',
        'string.pattern.base': passwordMessage,
        'any.required': 'Password is required',
      }),
  }),
};

const validateResetToken = {
  query: Joi.object({
    token: Joi.string().required().messages({
      'any.required': 'Reset token is required',
    }),
  }),
};

const changePassword = {
  body: Joi.object({
    currentPassword: Joi.string().required().messages({
      'any.required': 'Current password is required',
    }),
    newPassword: Joi.string()
      .min(8)
      .max(128)
      .pattern(passwordRegex)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.max': 'Password must not exceed 128 characters',
        'string.pattern.base': passwordMessage,
        'any.required': 'New password is required',
      }),
  }),
};

const changeEmail = {
  body: Joi.object({
    newEmail: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'New email is required',
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required to change email',
    }),
  }),
};

const updateAvatar = {
  body: Joi.object({
    avatar_url: avatarUrlSchema.allow(null, '').optional().messages({
      'string.uri': 'Avatar URL must be a valid http or https URL',
      'string.max': 'Avatar URL must not exceed 500 characters',
    }),
  }),
};

const logoutAll = {
  body: Joi.object({
    keepCurrent: Joi.boolean().optional().default(false),
  }),
};

const deleteSession = {
  params: Joi.object({
    sessionId: Joi.string().required().messages({
      'any.required': 'Session ID is required',
    }),
  }),
};

module.exports = {
  register,
  login,
  verifyEmailCode,
  verifyEmailToken,
  forgotPassword,
  resetPassword,
  validateResetToken,
  changePassword,
  changeEmail,
  updateAvatar,
  logoutAll,
  deleteSession,
};
