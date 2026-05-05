const knex = require('knex');

// Mock Knex globally
jest.mock('knex', () => {
  return jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    del: jest.fn().mockReturnThis(),
    raw: jest.fn(),
    // Add more methods as needed
  }));
});