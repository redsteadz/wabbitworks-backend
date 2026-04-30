const UserModel = require('./user.model');
const ApiError = require('../../utils/ApiError');

// Find user by ID
const findById = async (id) => {
  return UserModel.findById(id);
};

// Find user by ID (including inactive)
const findByIdAll = async (id) => {
  return UserModel.findByIdAll(id);
};

// Find user by email
const findByEmail = async (email) => {
  return UserModel.findByEmail(email);
};

// Find user by Google ID
const findByGoogleId = async (googleId) => {
  return UserModel.findByGoogleId(googleId);
};

// Create a new user
const create = async (userData) => {
  return UserModel.create(userData);
};

// Update user
const update = async (id, userData) => {
  const user = await UserModel.findById(id);
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  return UserModel.update(id, userData);
};

// Update last login timestamp
const updateLastLogin = async (id) => {
  return UserModel.updateLastLogin(id);
};

// Verify email
const verifyEmail = async (id) => {
  return UserModel.verifyEmail(id);
};

// Update password
const updatePassword = async (id, hashedPassword) => {
  return UserModel.updatePassword(id, hashedPassword);
};

// Update email
const updateEmail = async (id, newEmail) => {
  return UserModel.updateEmail(id, newEmail);
};

// Set pending email change
const setPendingEmail = async (id, pendingEmail) => {
  return UserModel.setPendingEmail(id, pendingEmail);
};

// Clear pending email
const clearPendingEmail = async (id) => {
  return UserModel.clearPendingEmail(id);
};

// Check if email exists
const emailExists = async (email, excludeUserId = null) => {
  return UserModel.emailExists(email, excludeUserId);
};

// Search users
const search = async (searchTerm, excludeUserId, limit) => {
  return UserModel.search(searchTerm, excludeUserId, limit);
};

module.exports = {
  findById,
  findByIdAll,
  findByEmail,
  create,
  update,
  updateLastLogin,
  verifyEmail,
  updatePassword,
  updateEmail,
  setPendingEmail,
  clearPendingEmail,
  emailExists,
  search,
  findByGoogleId,
};