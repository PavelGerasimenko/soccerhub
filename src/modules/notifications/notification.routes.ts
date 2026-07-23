import { Router, Response, NextFunction } from 'express';
import { query, body } from 'express-validator';
import NotificationService from './notification.service';
import { authMiddleware, AuthRequest } from '../../middleware/auth';
import { handleValidationErrors } from '../../middleware/validation';

const router = Router();
const service = new NotificationService();

router.get(
  '/users/:userId/notifications',
  authMiddleware,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;

      if (userId !== req.userId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only access your own preferences',
            statusCode: 403,
          },
        });
      }

      const preferences = await service.getPreferences(userId);
      return res.json({ success: true, data: preferences });
    } catch (error) {
      return next(error);
    }
  },
);

router.put(
  '/users/:userId/notifications',
  authMiddleware,
  [
    body('emailWelcome').optional().isBoolean(),
    body('emailBookingConfirmation').optional().isBoolean(),
    body('emailBookingCancellation').optional().isBoolean(),
    body('emailEventReminder').optional().isBoolean(),
    body('emailEventCompleted').optional().isBoolean(),
    body('emailHostReview').optional().isBoolean(),
    body('emailPlayerReview').optional().isBoolean(),
    body('emailEventUpdates').optional().isBoolean(),
  ] as any,
  handleValidationErrors,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;

      if (userId !== req.userId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only update your own preferences',
            statusCode: 403,
          },
        });
      }

      const preferences = await service.updatePreferences(userId, req.body);
      return res.json({ success: true, data: preferences });
    } catch (error) {
      return next(error);
    }
  },
);

router.get(
  '/users/:userId/notification-history',
  authMiddleware,
  [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
  ] as any,
  handleValidationErrors,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;

      if (userId !== req.userId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only access your own history',
            statusCode: 403,
          },
        });
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const result = await service.getEmailHistory(userId, limit, offset);
      return res.json({ success: true, data: result });
    } catch (error) {
      return next(error);
    }
  },
);

export default router;
