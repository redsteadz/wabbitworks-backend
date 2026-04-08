const Joi = require('joi');
const { TASK_STATUS, TASK_PRIORITY } = require('../../utils/constants');

const create = {
  body: Joi.object({
    title: Joi.string().min(1).max(255).trim().required().messages({
      'string.min': 'Title is required',
      'string.max': 'Title must not exceed 255 characters',
      'any.required': 'Title is required',
    }),
    description: Joi.string().max(2000).trim().allow('', null).messages({
      'string.max': 'Description must not exceed 2000 characters',
    }),
    team_id: Joi.string().uuid().required().messages({
      'string.guid': 'Invalid team ID format',
      'any.required': 'Team ID is required',
    }),
    assigned_to: Joi.string().uuid().allow(null).messages({
      'string.guid': 'Invalid assignee ID format',
    }),
    status: Joi.string()
      .valid(...Object.values(TASK_STATUS))
      .default(TASK_STATUS.TODO)
      .messages({
        'any.only': 'Invalid status',
      }),
    priority: Joi.string()
      .valid(...Object.values(TASK_PRIORITY))
      .default(TASK_PRIORITY.MEDIUM)
      .messages({
        'any.only': 'Invalid priority',
      }),
    due_date: Joi.date().iso().min('now').allow(null).messages({
      'date.min': 'Due date must be in the future',
      'date.format': 'Invalid date format',
    }),
  }),
};

const update = {
  params: Joi.object({
    id: Joi.string().uuid().required().messages({
      'string.guid': 'Invalid task ID format',
      'any.required': 'Task ID is required',
    }),
  }),
  body: Joi.object({
    title: Joi.string().min(1).max(255).trim().messages({
      'string.min': 'Title cannot be empty',
      'string.max': 'Title must not exceed 255 characters',
    }),
    description: Joi.string().max(2000).trim().allow('', null).messages({
      'string.max': 'Description must not exceed 2000 characters',
    }),
    assigned_to: Joi.string().uuid().allow(null).messages({
      'string.guid': 'Invalid assignee ID format',
    }),
    status: Joi.string()
      .valid(...Object.values(TASK_STATUS))
      .messages({
        'any.only': 'Invalid status',
      }),
    priority: Joi.string()
      .valid(...Object.values(TASK_PRIORITY))
      .messages({
        'any.only': 'Invalid priority',
      }),
    due_date: Joi.date().iso().allow(null).messages({
      'date.format': 'Invalid date format',
    }),
  }).min(1).messages({
    'object.min': 'At least one field is required to update',
  }),
};

const getById = {
  params: Joi.object({
    id: Joi.string().uuid().required().messages({
      'string.guid': 'Invalid task ID format',
      'any.required': 'Task ID is required',
    }),
  }),
};

const getByTeam = {
  params: Joi.object({
    teamId: Joi.string().uuid().required().messages({
      'string.guid': 'Invalid team ID format',
      'any.required': 'Team ID is required',
    }),
  }),
  query: Joi.object({
    status: Joi.string().valid(...Object.values(TASK_STATUS)),
    priority: Joi.string().valid(...Object.values(TASK_PRIORITY)),
    assigned_to: Joi.string().uuid(),
    search: Joi.string().max(100),
    sortBy: Joi.string().valid('created_at', 'due_date', 'priority', 'status'),
    sortOrder: Joi.string().valid('asc', 'desc'),
  }),
};

const getAll = {
  query: Joi.object({
    team_id: Joi.string().uuid(),
    status: Joi.string().valid(...Object.values(TASK_STATUS)),
    priority: Joi.string().valid(...Object.values(TASK_PRIORITY)),
    assigned_to_me: Joi.boolean(),
    search: Joi.string().max(100),
  }),
};

module.exports = {
  create,
  update,
  getById,
  getByTeam,
  getAll,
};