/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('verification_tokens', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('token', 255).notNullable().unique();
    table.string('token_hash', 255).notNullable();
    table.enum('type', ['email_verification', 'email_change']).notNullable();
    table.string('new_email', 255).nullable(); // For email change requests
    table.timestamp('expires_at').notNullable();
    table.timestamp('used_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Indexes
    table.index('token');
    table.index('token_hash');
    table.index('user_id');
    table.index('expires_at');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('verification_tokens');
};