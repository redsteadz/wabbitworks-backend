/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('session', (table) => {
    table.uuid('user_id').nullable();
    table.string('ip_address', 45).nullable();
    table.text('user_agent').nullable();
    table.string('device_type', 50).nullable();
    table.string('browser', 100).nullable();
    table.string('os', 100).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('last_activity_at').defaultTo(knex.fn.now());

    // Index for user sessions lookup
    table.index('user_id');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('session', (table) => {
    table.dropIndex('user_id');
    table.dropColumn('user_id');
    table.dropColumn('ip_address');
    table.dropColumn('user_agent');
    table.dropColumn('device_type');
    table.dropColumn('browser');
    table.dropColumn('os');
    table.dropColumn('created_at');
    table.dropColumn('last_activity_at');
  });
};
