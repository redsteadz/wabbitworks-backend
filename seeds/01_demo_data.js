const bcrypt = require('bcryptjs');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Clean up existing data (in correct order due to foreign keys)
  await knex('tasks').del();
  await knex('memberships').del();
  await knex('teams').del();
  await knex('users').del();

  // Create demo users
  const hashedPassword = await bcrypt.hash('password123', 12);

  const users = await knex('users')
    .insert([
      {
        email: 'john@example.com',
        password: hashedPassword,
        first_name: 'John',
        last_name: 'Doe',
      },
      {
        email: 'jane@example.com',
        password: hashedPassword,
        first_name: 'Jane',
        last_name: 'Smith',
      },
      {
        email: 'bob@example.com',
        password: hashedPassword,
        first_name: 'Bob',
        last_name: 'Wilson',
      },
    ])
    .returning('*');

  // Create demo teams
  const teams = await knex('teams')
    .insert([
      {
        name: 'Development Team',
        description: 'Frontend and Backend development team',
        created_by: users[0].id,
      },
      {
        name: 'Marketing Team',
        description: 'Marketing and growth team',
        created_by: users[1].id,
      },
    ])
    .returning('*');

  // Create memberships
  await knex('memberships').insert([
    // Development Team members
    { user_id: users[0].id, team_id: teams[0].id, role: 'owner' },
    { user_id: users[1].id, team_id: teams[0].id, role: 'member' },
    { user_id: users[2].id, team_id: teams[0].id, role: 'member' },
    // Marketing Team members
    { user_id: users[1].id, team_id: teams[1].id, role: 'owner' },
    { user_id: users[0].id, team_id: teams[1].id, role: 'member' },
  ]);

  // Create demo tasks
  await knex('tasks').insert([
    {
      title: 'Setup project repository',
      description: 'Initialize the project with proper structure and configurations',
      team_id: teams[0].id,
      created_by: users[0].id,
      assigned_to: users[0].id,
      status: 'completed',
      priority: 'high',
      due_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      completed_at: new Date(),
    },
    {
      title: 'Implement authentication',
      description: 'Add login and registration functionality',
      team_id: teams[0].id,
      created_by: users[0].id,
      assigned_to: users[1].id,
      status: 'in_progress',
      priority: 'high',
      due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Design landing page',
      description: 'Create mockups for the landing page',
      team_id: teams[1].id,
      created_by: users[1].id,
      assigned_to: users[0].id,
      status: 'todo',
      priority: 'medium',
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Write API documentation',
      description: 'Document all API endpoints',
      team_id: teams[0].id,
      created_by: users[0].id,
      assigned_to: users[2].id,
      status: 'todo',
      priority: 'low',
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  ]);
};