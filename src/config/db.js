const knex = require('knex');
const knexConfig = require('../../knexfile');
const env = require('./env');

const environment = env.nodeEnv || 'development';
const config = knexConfig[environment];

const db = knex(config);

// Test database connection
const testConnection = async () => {
  try {
    await db.raw('SELECT 1');
    console.log('Database connected successfully');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
};

module.exports = { db, testConnection };