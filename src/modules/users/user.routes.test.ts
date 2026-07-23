import request from 'supertest';
import app from '../../app';
import UserService from './user.service';
import { ConflictError, UnauthorizedError } from '../../utils/errors';
import * as jwtUtils from '../../utils/jwt';

jest.mock('./user.service');
jest.mock('../../utils/jwt');

describe('User Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user and return tokens', async () => {
      const mockResponse = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe',
          created_at: new Date(),
          updated_at: new Date(),
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      (UserService.registerUser as jest.Mock).mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          first_name: 'John',
          last_name: 'Doe',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Password123!',
          first_name: 'John',
          last_name: 'Doe',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for short password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'short',
          first_name: 'John',
          last_name: 'Doe',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 409 if email already exists', async () => {
      (UserService.registerUser as jest.Mock).mockRejectedValue(
        new ConflictError('Email already registered'),
      );

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'Password123!',
          first_name: 'John',
          last_name: 'Doe',
        });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('CONFLICT');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login user and return tokens', async () => {
      const mockResponse = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe',
          created_at: new Date(),
          updated_at: new Date(),
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      (UserService.loginUser as jest.Mock).mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('test@example.com');
    });

    it('should return 401 for invalid credentials', async () => {
      (UserService.loginUser as jest.Mock).mockRejectedValue(
        new UnauthorizedError('Invalid email or password'),
      );

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword!',
        });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('should return user by id', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        created_at: new Date(),
        updated_at: new Date(),
      };

      (UserService.getUserById as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/v1/users/user-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('test@example.com');
    });
  });

  describe('PUT /api/v1/users/:id', () => {
    it('should update user when authenticated', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'Jane',
        last_name: 'Smith',
        created_at: new Date(),
        updated_at: new Date(),
      };

      (jwtUtils.verifyAccessToken as jest.Mock).mockReturnValue({
        id: 'user-123',
        email: 'test@example.com',
      });
      (UserService.updateUser as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .put('/api/v1/users/user-123')
        .set('Authorization', 'Bearer valid-token')
        .send({
          first_name: 'Jane',
          last_name: 'Smith',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .put('/api/v1/users/user-123')
        .send({
          first_name: 'Jane',
        });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    it('should delete user when authenticated', async () => {
      (jwtUtils.verifyAccessToken as jest.Mock).mockReturnValue({
        id: 'user-123',
        email: 'test@example.com',
      });
      (UserService.deleteUser as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/api/v1/users/user-123')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(204);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .delete('/api/v1/users/user-123');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });
});
