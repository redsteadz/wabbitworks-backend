/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('notifications', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('user_id').notNullable(); // Recipient
    table.uuid('actor_id').nullable(); // Who performed the action
    table.enum('type', [
      'team_invitation',
      'invitation_accepted',
      'invitation_declined',
      'task_assigned',
      'task_updated',
      'task_completed',
      'task_comment',
      'member_added',
      'member_removed',
      'role_changed',
      'due_date_reminder',
      'task_overdue',
    ]).notNullable();
    table.string('title', 255).notNullable();
    table.text('message').notNullable();
    table.jsonb('metadata').nullable(); // Store related IDs, links, etc.
    table.string('action_url', 500).nullable(); // Link to the relevant page
    table.boolean('is_read').defaultTo(false);
    table.timestamp('read_at').nullable();
    table.boolean('email_sent').defaultTo(false);
    table.timestamp('email_sent_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Foreign keys
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('actor_id').references('id').inTable('users').onDelete('SET NULL');

    // Indexes
    table.index('user_id');
    table.index('actor_id');
    table.index('type');
    table.index('is_read');
    table.index('created_at');
    table.index(['user_id', 'is_read']); // Composite index for unread notifications
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('notifications');
};