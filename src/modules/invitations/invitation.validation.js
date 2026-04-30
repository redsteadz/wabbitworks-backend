const Joi = require('joi');
const { MEMBERSHIP_ROLE, INVITATION_STATUS } = require('../../utils/constants');

const create = {
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
    message: Joi.string().max(500).allow('', null).messages({
      'string.max': 'Message must not exceed 500 characters',
    }),
  }),
};

const getById = {
  params: Joi.object({
    id: Joi.string().uuid().required().messages({
      'string.guid': 'Invalid invitation ID format',
      'any.required': 'Invitation ID is required',
    }),
  }),
};

const getReceived = {
  query: Joi.object({
    status: Joi.string().valid(...Object.values(INVITATION_STATUS)),
  }),
};

const getSent = {
  query: Joi.object({
    status: Joi.string().valid(...Object.values(INVITATION_STATUS)),
    team_id: Joi.string().uuid(),
  }),
};

const getTeamInvitations = {
  params: Joi.object({
    teamId: Joi.string().uuid().required().messages({
      'string.guid': 'Invalid team ID format',
      'any.required': 'Team ID is required',
    }),
  }),
  query: Joi.object({
    status: Joi.string().valid(...Object.values(INVITATION_STATUS)),
  }),
};

module.exports = {
  create,
  getById,
  getReceived,
  getSent,
  getTeamInvitations,
};