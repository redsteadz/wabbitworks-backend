/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('memberships', (table) => {
    table.uuid('invitation_id').nullable();
    
    // Foreign key to track which invitation created this membership
    table.foreign('invitation_id').references('id').inTable('team_invitations').onDelete('SET NULL');
    
    table.index('invitation_id');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('memberships', (table) => {
    table.dropForeign('invitation_id');
    table.dropIndex('invitation_id');
    table.dropColumn('invitation_id');
  });
};