const Joi = require('joi');
const { MEMBERSHIP_ROLE } = require('../../utils/constants');

const addMember = {
  params: Joi.object({
    teamId: Joi.string().uuid().required().messages({
      'string.guid': 'Invalid team ID format',
      'any.required': 'Team ID is required',
    }),
  }),
  body: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
    role: Joi.string()
      .valid(MEMBERSHIP_ROLE.ADMIN, MEMBERSHIP_ROLE.MEMBER)
      .default(MEMBERSHIP_ROLE.MEMBER)
      .messages({
        'any.only': 'Role must be either admin or member',
      }),
  }),
};

const updateRole = {
  params: Joi.object({
    teamId: Joi.string().uuid().required().messages({
      'string.guid': 'Invalid team ID format',
      'any.required': 'Team ID is required',
    }),
    memberId: Joi.string().uuid().required().messages({
      'string.guid': 'Invalid member ID format',
      'any.required': 'Member ID is required',
    }),
  }),
  body: Joi.object({
    role: Joi.string()
      .valid(MEMBERSHIP_ROLE.ADMIN, MEMBERSHIP_ROLE.MEMBER)
      .required()
      .messages({
        'any.only': 'Role must be either admin or member',
        'any.required': 'Role is required',
      }),
  }),
};

const removeMember = {
  params: Joi.object({
    teamId: Joi.string().uuid().required().messages({
      'string.guid': 'Invalid team ID format',
      'any.required': 'Team ID is required',
    }),
    memberId: Joi.string().uuid().required().messages({
      'string.guid': 'Invalid member ID format',
      'any.required': 'Member ID is required',
    }),
  }),
};

const leaveTeam = {
  params: Joi.object({
    teamId: Joi.string().uuid().required().messages({
      'string.guid': 'Invalid team ID format',
      'any.required': 'Team ID is required',
    }),
  }),
};

module.exports = {
  addMember,
  updateRole,
  removeMember,
  leaveTeam,
};