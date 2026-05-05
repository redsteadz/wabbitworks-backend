const authService = require('../src/modules/auth/auth.service');
const userService = require('../src/modules/users/user.service');
const emailService = require('../src/services/email.service');
const ApiError = require('../src/utils/ApiError');
const { hashPassword } = require('../src/utils/bcrypt');

// Mock dependencies
jest.mock('../src/modules/users/user.service');
jest.mock('../src/services/email.service');
jest.mock('../src/utils/bcrypt');
jest.mock('../src/modules/auth/verificationToken.model');
jest.mock('../src/modules/auth/avatar.storage');

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });


    it('should not register if email already exists', async () => {
      const userData = { email: 'existing@example.com', password: 'password123' };
      userService.findByEmail.mockResolvedValue({ id: 1, email: userData.email });

      await expect(authService.register(userData)).rejects.toThrow();
      expect(userService.findByEmail).toHaveBeenCalledWith(userData.email);
    });
  });

  describe('getProfile', () => {
    it('should return user profile successfully', async () => {
      const userId = 1;
      const user = { id: userId, first_name: 'Test', last_name: 'User', email: 'test@example.com' };
      userService.findById.mockResolvedValue(user);

      const result = await authService.getProfile(userId);

      expect(userService.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(user);
    });
  });
});