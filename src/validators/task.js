const Joi = require('joi');

const createTaskSchema = Joi.object({
  title: Joi.string().min(2).max(255).required(),
  description: Joi.string().max(5000).allow('', null).optional(),
  assigned_to: Joi.string().uuid().allow(null).optional(),
  status: Joi.string().valid('todo', 'in_progress', 'review', 'completed').optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
  due_date: Joi.date().allow(null).optional(),
});

const updateTaskSchema = Joi.object({
  title: Joi.string().min(2).max(255).optional(),
  description: Joi.string().max(5000).allow('', null).optional(),
  assigned_to: Joi.string().uuid().allow(null).optional(),
  status: Joi.string().valid('todo', 'in_progress', 'review', 'completed').optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
  due_date: Joi.date().allow(null).optional(),
  is_active: Joi.boolean().optional(),
});

module.exports = { createTaskSchema, updateTaskSchema };
