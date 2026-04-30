/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('users', (table) => {
    table.boolean('email_verified').defaultTo(false);
    table.timestamp('email_verified_at').nullable();
    table.string('pending_email', 255).nullable();
    table.timestamp('pending_email_created_at').nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('users', (table) => {
    table.dropColumn('email_verified');
    table.dropColumn('email_verified_at');
    table.dropColumn('pending_email');
    table.dropColumn('pending_email_created_at');
  });
};