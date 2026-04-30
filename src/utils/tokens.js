const crypto = require('crypto');

/**
 * Generate a random token
 * @param {number} bytes - Number of random bytes (default: 32)
 * @returns {string} - Hex encoded token
 */
const generateToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

/**
 * Generate a 6-digit verification code
 * @returns {string} - 6 digit code
 */
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Hash a token using SHA-256
 * @param {string} token - Plain token
 * @returns {string} - Hashed token
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Create expiration date
 * @param {number} hours - Hours from now
 * @returns {Date} - Expiration date
 */
const createExpirationDate = (hours) => {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  return date;
};

/**
 * Check if a date is expired
 * @param {Date|string} expirationDate - Expiration date
 * @returns {boolean} - True if expired
 */
const isExpired = (expirationDate) => {
  return new Date() > new Date(expirationDate);
};

module.exports = {
  generateToken,
  generateVerificationCode,
  hashToken,
  createExpirationDate,
  isExpired,
};