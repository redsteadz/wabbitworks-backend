/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('team_invitations', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('team_id').notNullable();
    table.uuid('invited_user_id').notNullable();
    table.uuid('invited_by').notNullable();
    table.string('invited_email', 255).notNullable();
    table.enum('role', ['admin', 'member']).defaultTo('member');
    table.enum('status', ['pending', 'accepted', 'declined', 'cancelled']).defaultTo('pending');
    table.text('message').nullable(); // Optional invitation message
    table.timestamp('responded_at').nullable();
    table.timestamp('expires_at').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Foreign keys
    table.foreign('team_id').references('id').inTable('teams').onDelete('CASCADE');
    table.foreign('invited_user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('invited_by').references('id').inTable('users').onDelete('CASCADE');

    // Prevent duplicate pending invitations
    table.unique(['team_id', 'invited_user_id', 'status']);

    // Indexes
    table.index('team_id');
    table.index('invited_user_id');
    table.index('invited_by');
    table.index('status');
    table.index('expires_at');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('team_invitations');
};