const bcrypt = require('bcryptjs');
const env = require('../config/env');

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(env.bcryptSaltRounds);
  return bcrypt.hash(password, salt);
};

/**
 * Compare a password with a hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} - True if match, false otherwise
 */
const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

module.exports = {
  hashPassword,
  comparePassword,
};