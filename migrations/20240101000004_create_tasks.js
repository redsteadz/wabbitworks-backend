/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('tasks', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.string('title', 255).notNullable();
    table.text('description').nullable();
    table.uuid('team_id').notNullable();
    table.uuid('created_by').notNullable();
    table.uuid('assigned_to').nullable();
    table.enum('status', ['todo', 'in_progress', 'review', 'completed']).defaultTo('todo');
    table.enum('priority', ['low', 'medium', 'high', 'urgent']).defaultTo('medium');
    table.date('due_date').nullable();
    table.timestamp('completed_at').nullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Foreign keys
    table.foreign('team_id').references('id').inTable('teams').onDelete('CASCADE');
    table.foreign('created_by').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('assigned_to').references('id').inTable('users').onDelete('SET NULL');

    // Indexes
    table.index('team_id');
    table.index('created_by');
    table.index('assigned_to');
    table.index('status');
    table.index('priority');
    table.index('due_date');
    table.index('is_active');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('tasks');
};