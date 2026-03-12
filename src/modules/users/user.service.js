const UserModel = require('./user.model');
const ApiError = require('../../utils/ApiError');

// Find user by ID
const findById = async (id) => {
  return UserModel.findById(id);
};

// Find user by email
const findByEmail = async (email) => {
  return UserModel.findByEmail(email);
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

// Search users
const search = async (searchTerm, excludeUserId, limit) => {
  return UserModel.search(searchTerm, excludeUserId, limit);
};

module.exports = {
  findById,
  findByEmail,
  create,
  update,
  updateLastLogin,
  search,
};