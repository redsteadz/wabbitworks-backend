const userService = require('../src/modules/users/user.service');
const UserModel = require('../src/modules/users/user.model');
const ApiError = require('../src/utils/ApiError');

// Mock dependencies
jest.mock('../src/modules/users/user.model');

describe('User Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return user by ID', async () => {
      const userId = 1;
      const user = { id: userId, first_name: 'John', last_name: 'Doe', email: 'john@example.com' };

      UserModel.findById.mockResolvedValue(user);

      const result = await userService.findById(userId);

      expect(UserModel.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(user);
    });

    it('should return null when user not found', async () => {
      const userId = 999;
      UserModel.findById.mockResolvedValue(null);

      const result = await userService.findById(userId);

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return user by email', async () => {
      const email = 'john@example.com';
      const user = { id: 1, first_name: 'John', last_name: 'Doe', email };

      UserModel.findByEmail.mockResolvedValue(user);

      const result = await userService.findByEmail(email);

      expect(UserModel.findByEmail).toHaveBeenCalledWith(email);
      expect(result).toEqual(user);
    });

    it('should return null when email not found', async () => {
      const email = 'notfound@example.com';
      UserModel.findByEmail.mockResolvedValue(null);

      const result = await userService.findByEmail(email);

      expect(result).toBeNull();
    });
  });

  describe('findByGoogleId', () => {
    it('should return user by Google ID', async () => {
      const googleId = '123456789';
      const user = { id: 1, first_name: 'John', last_name: 'Doe', google_id: googleId };

      UserModel.findByGoogleId.mockResolvedValue(user);

      const result = await userService.findByGoogleId(googleId);

      expect(UserModel.findByGoogleId).toHaveBeenCalledWith(googleId);
      expect(result).toEqual(user);
    });
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      const userData = { first_name: 'John', last_name: 'Doe', email: 'john@example.com', password: 'hashedpassword' };
      const createdUser = { id: 1, ...userData };

      UserModel.create.mockResolvedValue(createdUser);

      const result = await userService.create(userData);

      expect(UserModel.create).toHaveBeenCalledWith(userData);
      expect(result).toEqual(createdUser);
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const userId = 1;
      const userData = { name: 'John Smith' };
      const existingUser = { id: userId, name: 'John Doe', email: 'john@example.com' };
      const updatedUser = { ...existingUser, ...userData };

      UserModel.findById.mockResolvedValue(existingUser);
      UserModel.update.mockResolvedValue(updatedUser);

      const result = await userService.update(userId, userData);

      expect(UserModel.findById).toHaveBeenCalledWith(userId);
      expect(UserModel.update).toHaveBeenCalledWith(userId, userData);
      expect(result).toEqual(updatedUser);
    });

    it('should throw error if user not found', async () => {
      const userId = 1;
      const userData = { name: 'John Smith' };

      UserModel.findById.mockResolvedValue(null);

      await expect(userService.update(userId, userData)).rejects.toThrow(ApiError);
    });
  });

  describe('updateLastLogin', () => {
    it('should update last login timestamp', async () => {
      const userId = 1;
      const updatedUser = { id: userId, last_login_at: new Date() };

      UserModel.updateLastLogin.mockResolvedValue(updatedUser);

      const result = await userService.updateLastLogin(userId);

      expect(UserModel.updateLastLogin).toHaveBeenCalledWith(userId);
      expect(result).toEqual(updatedUser);
    });
  });

  describe('verifyEmail', () => {
    it('should verify user email', async () => {
      const userId = 1;
      const verifiedUser = { id: userId, email_verified: true };

      UserModel.verifyEmail.mockResolvedValue(verifiedUser);

      const result = await userService.verifyEmail(userId);

      expect(UserModel.verifyEmail).toHaveBeenCalledWith(userId);
      expect(result).toEqual(verifiedUser);
    });
  });

  describe('updatePassword', () => {
    it('should update user password', async () => {
      const userId = 1;
      const hashedPassword = 'newhashedpassword';
      const updatedUser = { id: userId, password: hashedPassword };

      UserModel.updatePassword.mockResolvedValue(updatedUser);

      const result = await userService.updatePassword(userId, hashedPassword);

      expect(UserModel.updatePassword).toHaveBeenCalledWith(userId, hashedPassword);
      expect(result).toEqual(updatedUser);
    });
  });

  describe('updateEmail', () => {
    it('should update user email', async () => {
      const userId = 1;
      const newEmail = 'newemail@example.com';
      const updatedUser = { id: userId, email: newEmail };

      UserModel.updateEmail.mockResolvedValue(updatedUser);

      const result = await userService.updateEmail(userId, newEmail);

      expect(UserModel.updateEmail).toHaveBeenCalledWith(userId, newEmail);
      expect(result).toEqual(updatedUser);
    });
  });

  describe('setPendingEmail', () => {
    it('should set pending email', async () => {
      const userId = 1;
      const pendingEmail = 'pending@example.com';
      const updatedUser = { id: userId, pending_email: pendingEmail };

      UserModel.setPendingEmail.mockResolvedValue(updatedUser);

      const result = await userService.setPendingEmail(userId, pendingEmail);

      expect(UserModel.setPendingEmail).toHaveBeenCalledWith(userId, pendingEmail);
      expect(result).toEqual(updatedUser);
    });
  });

  describe('clearPendingEmail', () => {
    it('should clear pending email', async () => {
      const userId = 1;
      const updatedUser = { id: userId, pending_email: null };

      UserModel.clearPendingEmail.mockResolvedValue(updatedUser);

      const result = await userService.clearPendingEmail(userId);

      expect(UserModel.clearPendingEmail).toHaveBeenCalledWith(userId);
      expect(result).toEqual(updatedUser);
    });
  });

  describe('emailExists', () => {
    it('should check if email exists', async () => {
      const email = 'john@example.com';
      const excludeUserId = 2;

      UserModel.emailExists.mockResolvedValue(true);

      const result = await userService.emailExists(email, excludeUserId);

      expect(UserModel.emailExists).toHaveBeenCalledWith(email, excludeUserId);
      expect(result).toBe(true);
    });

    it('should check if email exists without exclude user', async () => {
      const email = 'john@example.com';

      UserModel.emailExists.mockResolvedValue(false);

      const result = await userService.emailExists(email);

      expect(UserModel.emailExists).toHaveBeenCalledWith(email, null);
      expect(result).toBe(false);
    });
  });

  describe('search', () => {
    it('should search users', async () => {
      const searchTerm = 'john';
      const excludeUserId = 1;
      const limit = 10;
      const users = [
        { id: 2, name: 'John Doe', email: 'john@example.com' },
        { id: 3, name: 'Johnny Smith', email: 'johnny@example.com' },
      ];

      UserModel.search.mockResolvedValue(users);

      const result = await userService.search(searchTerm, excludeUserId, limit);

      expect(UserModel.search).toHaveBeenCalledWith(searchTerm, excludeUserId, limit);
      expect(result).toEqual(users);
    });
  });
});