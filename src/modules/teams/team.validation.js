const Joi = require('joi');
const { MEMBERSHIP_ROLE } = require('../../utils/constants');

const create = {
  body: Joi.object({
    name: Joi.string().min(1).max(100).trim().required(),
    description: Joi.string().max(500).trim().allow('', null),
  }),
};

const update = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    name: Joi.string().min(1).max(100).trim(),
    description: Joi.string().max(500).trim().allow('', null),
  }).min(1),
};

const getById = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

module.exports = {
  create,
  update,
  getById,
};