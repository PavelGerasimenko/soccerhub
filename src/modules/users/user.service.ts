import UserRepository from './user.repository';
import { User, CreateUserRequest, UpdateUserRequest, AuthResponse, LoginRequest } from '../../types/user.interface';
import { comparePassword } from '../../utils/password';
import { generateAccessToken, generateRefreshToken } from '../../utils/jwt';
import { ConflictError, UnauthorizedError } from '../../utils/errors';

export class UserService {
  async registerUser(data: CreateUserRequest): Promise<AuthResponse> {
    const normalizedEmail = data.email.toLowerCase();
    const emailExists = await UserRepository.emailExists(normalizedEmail);

    if (emailExists) {
      throw new ConflictError('Email already registered');
    }

    const user = await UserRepository.createUser(
      normalizedEmail,
      data.password,
      data.first_name,
      data.last_name,
      {
        phone: data.phone,
        gender: data.gender,
        skill_level: data.skill_level,
        preferred_positions: data.preferred_positions,
      },
    );

    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async loginUser(data: LoginRequest): Promise<AuthResponse> {
    const user = await UserRepository.getUserByEmail(data.email);

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const passwordHash = await UserRepository.getPasswordHash(data.email);
    if (!passwordHash) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isPasswordValid = await comparePassword(data.password, passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async getUserById(id: string): Promise<User> {
    const user = await UserRepository.getUserById(id);

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async updateUser(id: string, data: UpdateUserRequest): Promise<User> {
    const user = await UserRepository.updateUser(id, data);
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await UserRepository.deleteUser(id);
  }
}

export default new UserService();
