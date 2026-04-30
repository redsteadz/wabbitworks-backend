/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('users', (table) => {
    table.string('google_id', 255).unique().nullable();
    table.string('password', 255).nullable().alter();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('users', (table) => {
    table.dropColumn('google_id');
    table.string('password', 255).notNullable().alter();
  });
};
