const userService = require('../users/user.service');
const membershipService = require('../memberships/membership.service');
const ApiError = require('../../utils/ApiError');
const { hashPassword } = require('../../utils/bcrypt');

// Register a new user
const register = async (userData) => {
  // Check if email already exists
  const existingUser = await userService.findByEmail(userData.email);
  if (existingUser) {
    throw ApiError.conflict('Email already registered');
  }

  // Hash password
  const hashedPassword = await hashPassword(userData.password);

  // Create user
  const user = await userService.create({
    ...userData,
    password: hashedPassword,
  });

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

// Get current user profile with teams
const getProfile = async (userId) => {
  const user = await userService.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  // Get user's teams
  const memberships = await membershipService.findByUser(userId);

  const { password: _, ...userWithoutPassword } = user;
  return {
    ...userWithoutPassword,
    teams: memberships,
  };
};

module.exports = {
  register,
  getProfile,
};