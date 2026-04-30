const Joi = require('joi');
const { NOTIFICATION_TYPE } = require('../../utils/constants');

const getAll = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    is_read: Joi.boolean(),
    type: Joi.string().valid(...Object.values(NOTIFICATION_TYPE)),
  }),
};

const getById = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

const updatePreferences = {
  body: Joi.object({
    // Email preferences
    email_team_invitation: Joi.boolean(),
    email_invitation_response: Joi.boolean(),
    email_task_assigned: Joi.boolean(),
    email_task_updated: Joi.boolean(),
    email_task_completed: Joi.boolean(),
    email_due_date_reminder: Joi.boolean(),
    email_task_overdue: Joi.boolean(),
    email_member_added: Joi.boolean(),
    email_role_changed: Joi.boolean(),

    // In-app preferences
    inapp_team_invitation: Joi.boolean(),
    inapp_invitation_response: Joi.boolean(),
    inapp_task_assigned: Joi.boolean(),
    inapp_task_updated: Joi.boolean(),
    inapp_task_completed: Joi.boolean(),
    inapp_due_date_reminder: Joi.boolean(),
    inapp_task_overdue: Joi.boolean(),
    inapp_member_added: Joi.boolean(),
    inapp_role_changed: Joi.boolean(),
  }).min(1),
};

module.exports = {
  getAll,
  getById,
  updatePreferences,
};