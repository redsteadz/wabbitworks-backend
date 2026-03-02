/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('memberships', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('user_id').notNullable();
    table.uuid('team_id').notNullable();
    table.enum('role', ['owner', 'admin', 'member']).defaultTo('member');
    table.enum('status', ['pending', 'active', 'inactive']).defaultTo('active');
    table.string('invited_email', 255).nullable();
    table.timestamp('joined_at').defaultTo(knex.fn.now());
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Foreign keys
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('team_id').references('id').inTable('teams').onDelete('CASCADE');

    // Unique constraint - a user can only be a member of a team once
    table.unique(['user_id', 'team_id']);

    // Indexes
    table.index('user_id');
    table.index('team_id');
    table.index('role');
    table.index('status');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('memberships');
};