const Joi = require('joi');

const createTeamSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(2000).allow('', null).optional(),
});

const updateTeamSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  description: Joi.string().max(2000).allow('', null).optional(),
});

const addMemberSchema = Joi.object({
  email: Joi.string().email().required(),
  role: Joi.string().valid('owner', 'admin', 'member').optional(),
});

const updateMemberSchema = Joi.object({
  role: Joi.string().valid('owner', 'admin', 'member').optional(),
  status: Joi.string().valid('pending', 'active', 'inactive').optional(),
});

module.exports = { createTeamSchema, updateTeamSchema, addMemberSchema, updateMemberSchema };
