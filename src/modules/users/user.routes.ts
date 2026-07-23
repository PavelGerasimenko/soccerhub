import { Router } from 'express';
import { body } from 'express-validator';
import UserService from './user.service';
import { authMiddleware, optionalAuthMiddleware, AuthRequest } from '../../middleware/auth';
import { handleValidationErrors } from '../../middleware/validation';

const router = Router();

// POST /auth/register - Register a new user
router.post(
  '/auth/register',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    body('first_name')
      .notEmpty()
      .trim()
      .withMessage('First name is required'),
    body('last_name')
      .notEmpty()
      .trim()
      .withMessage('Last name is required'),
    body('phone')
      .optional({ checkFalsy: true })
      .isMobilePhone('any')
      .withMessage('Valid phone number is required'),
    body('gender')
      .optional()
      .isIn(['male', 'female', 'other'])
      .withMessage('Invalid gender'),
    body('skill_level')
      .optional()
      .isIn(['beginner', 'intermediate', 'advanced', 'professional'])
      .withMessage('Invalid skill level'),
  ] as any,
  handleValidationErrors,
  async (req: any, res: any, next: any) => {
    try {
      const result = await UserService.registerUser(req.body);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
);

// POST /auth/login - Login user
router.post(
  '/auth/login',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ] as any,
  handleValidationErrors,
  async (req: any, res: any, next: any) => {
    try {
      const result = await UserService.loginUser(req.body);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
);

// GET /users/:id - Get user by ID
router.get(
  '/users/:id',
  optionalAuthMiddleware,
  async (req: any, res: any, next: any) => {
    try {
      const user = await UserService.getUserById(req.params.id);
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },
);

// PUT /users/:id - Update user (requires auth)
router.put(
  '/users/:id',
  authMiddleware,
  [
    body('first_name')
      .optional()
      .notEmpty()
      .trim()
      .withMessage('First name cannot be empty'),
    body('last_name')
      .optional()
      .notEmpty()
      .trim()
      .withMessage('Last name cannot be empty'),
    body('phone')
      .optional({ checkFalsy: true })
      .isMobilePhone('any')
      .withMessage('Valid phone number is required'),
    body('skill_level')
      .optional()
      .isIn(['beginner', 'intermediate', 'advanced', 'professional'])
      .withMessage('Invalid skill level'),
  ] as any,
  handleValidationErrors,
  async (req: AuthRequest, res: any, next: any) => {
    try {
      if (req.userId !== req.params.id) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Cannot update another user',
            statusCode: 403,
          },
        });
      }

      const user = await UserService.updateUser(req.params.id, req.body);
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },
);

// DELETE /users/:id - Delete user (requires auth)
router.delete(
  '/users/:id',
  authMiddleware,
  async (req: AuthRequest, res: any, next: any) => {
    try {
      if (req.userId !== req.params.id) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Cannot delete another user',
            statusCode: 403,
          },
        });
      }

      await UserService.deleteUser(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
);

export default router;
