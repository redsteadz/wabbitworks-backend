/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('notification_preferences', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('user_id').notNullable().unique();
    
    // Email notification preferences
    table.boolean('email_team_invitation').defaultTo(true);
    table.boolean('email_invitation_response').defaultTo(true);
    table.boolean('email_task_assigned').defaultTo(true);
    table.boolean('email_task_updated').defaultTo(false);
    table.boolean('email_task_completed').defaultTo(false);
    table.boolean('email_due_date_reminder').defaultTo(true);
    table.boolean('email_task_overdue').defaultTo(true);
    table.boolean('email_member_added').defaultTo(false);
    table.boolean('email_role_changed').defaultTo(true);
    
    // In-app notification preferences
    table.boolean('inapp_team_invitation').defaultTo(true);
    table.boolean('inapp_invitation_response').defaultTo(true);
    table.boolean('inapp_task_assigned').defaultTo(true);
    table.boolean('inapp_task_updated').defaultTo(true);
    table.boolean('inapp_task_completed').defaultTo(true);
    table.boolean('inapp_due_date_reminder').defaultTo(true);
    table.boolean('inapp_task_overdue').defaultTo(true);
    table.boolean('inapp_member_added').defaultTo(true);
    table.boolean('inapp_role_changed').defaultTo(true);
    
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Foreign key
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('notification_preferences');
};