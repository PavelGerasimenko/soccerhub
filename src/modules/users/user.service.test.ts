import UserService from './user.service';
import UserRepository from './user.repository';
import { ConflictError, UnauthorizedError } from '../../utils/errors';
import * as passwordUtils from '../../utils/password';
import * as jwtUtils from '../../utils/jwt';

jest.mock('./user.repository');
jest.mock('../../utils/password');
jest.mock('../../utils/jwt');

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should successfully register a new user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        created_at: new Date(),
        updated_at: new Date(),
      };

      (UserRepository.emailExists as jest.Mock).mockResolvedValue(false);
      (UserRepository.createUser as jest.Mock).mockResolvedValue(mockUser);
      (jwtUtils.generateAccessToken as jest.Mock).mockReturnValue('access-token');
      (jwtUtils.generateRefreshToken as jest.Mock).mockReturnValue('refresh-token');

      const result = await UserService.registerUser({
        email: 'test@example.com',
        password: 'Password123!',
        first_name: 'John',
        last_name: 'Doe',
      });

      expect(result.user).toEqual(mockUser);
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(UserRepository.emailExists).toHaveBeenCalledWith(
        'test@example.com',
      );
    });

    it('should throw ConflictError if email already exists', async () => {
      (UserRepository.emailExists as jest.Mock).mockResolvedValue(true);

      await expect(
        UserService.registerUser({
          email: 'existing@example.com',
          password: 'Password123!',
          first_name: 'John',
          last_name: 'Doe',
        }),
      ).rejects.toThrow(ConflictError);
    });

    it('should normalize email to lowercase', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        created_at: new Date(),
        updated_at: new Date(),
      };

      (UserRepository.emailExists as jest.Mock).mockResolvedValue(false);
      (UserRepository.createUser as jest.Mock).mockResolvedValue(mockUser);
      (jwtUtils.generateAccessToken as jest.Mock).mockReturnValue('token');
      (jwtUtils.generateRefreshToken as jest.Mock).mockReturnValue('token');

      await UserService.registerUser({
        email: 'TEST@EXAMPLE.COM',
        password: 'Password123!',
        first_name: 'John',
        last_name: 'Doe',
      });

      expect(UserRepository.emailExists).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(UserRepository.createUser).toHaveBeenCalledWith(
        'test@example.com',
        'Password123!',
        'John',
        'Doe',
        expect.any(Object),
      );
    });
  });

  describe('loginUser', () => {
    it('should successfully login a user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        created_at: new Date(),
        updated_at: new Date(),
      };

      (UserRepository.getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (UserRepository.getPasswordHash as jest.Mock).mockResolvedValue(
        'hashed-password',
      );
      (passwordUtils.comparePassword as jest.Mock).mockResolvedValue(true);
      (jwtUtils.generateAccessToken as jest.Mock).mockReturnValue('access-token');
      (jwtUtils.generateRefreshToken as jest.Mock).mockReturnValue('refresh-token');

      const result = await UserService.loginUser({
        email: 'test@example.com',
        password: 'Password123!',
      });

      expect(result.user).toEqual(mockUser);
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
    });

    it('should throw UnauthorizedError if user not found', async () => {
      (UserRepository.getUserByEmail as jest.Mock).mockResolvedValue(null);

      await expect(
        UserService.loginUser({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        }),
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError if password is incorrect', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        created_at: new Date(),
        updated_at: new Date(),
      };

      (UserRepository.getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (UserRepository.getPasswordHash as jest.Mock).mockResolvedValue(
        'hashed-password',
      );
      (passwordUtils.comparePassword as jest.Mock).mockResolvedValue(false);

      await expect(
        UserService.loginUser({
          email: 'test@example.com',
          password: 'WrongPassword!',
        }),
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        created_at: new Date(),
        updated_at: new Date(),
      };

      (UserRepository.getUserById as jest.Mock).mockResolvedValue(mockUser);

      const result = await UserService.getUserById('user-123');

      expect(result).toEqual(mockUser);
      expect(UserRepository.getUserById).toHaveBeenCalledWith('user-123');
    });

    it('should throw error if user not found', async () => {
      (UserRepository.getUserById as jest.Mock).mockResolvedValue(null);

      await expect(UserService.getUserById('nonexistent')).rejects.toThrow(
        'User not found',
      );
    });
  });

  describe('updateUser', () => {
    it('should successfully update user', async () => {
      const updatedUser = {
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'Jane',
        last_name: 'Smith',
        created_at: new Date(),
        updated_at: new Date(),
      };

      (UserRepository.updateUser as jest.Mock).mockResolvedValue(updatedUser);

      const result = await UserService.updateUser('user-123', {
        first_name: 'Jane',
        last_name: 'Smith',
      });

      expect(result).toEqual(updatedUser);
      expect(UserRepository.updateUser).toHaveBeenCalledWith('user-123', {
        first_name: 'Jane',
        last_name: 'Smith',
      });
    });
  });

  describe('deleteUser', () => {
    it('should successfully delete user', async () => {
      (UserRepository.deleteUser as jest.Mock).mockResolvedValue(undefined);

      await UserService.deleteUser('user-123');

      expect(UserRepository.deleteUser).toHaveBeenCalledWith('user-123');
    });
  });
});
