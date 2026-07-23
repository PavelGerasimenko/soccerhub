import { Router, Response, NextFunction } from 'express';
import { query } from 'express-validator';
import HostDashboardService from './hostDashboard.service';
import { authMiddleware, AuthRequest } from '../../middleware/auth';
import { handleValidationErrors } from '../../middleware/validation';

const router = Router();
const service = new HostDashboardService();

router.get(
  '/hosts/:userId/dashboard',
  authMiddleware,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;

      if (userId !== req.userId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only access your own dashboard',
            statusCode: 403,
          },
        });
      }

      const dashboard = await service.getDashboardOverview(userId);
      return res.json({ success: true, data: dashboard });
    } catch (error) {
      return next(error);
    }
  },
);

router.get(
  '/hosts/:userId/earnings',
  authMiddleware,
  [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
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
            message: 'You can only access your own earnings',
            statusCode: 403,
          },
        });
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const result = await service.getEarnings(userId, startDate, endDate, limit, offset);
      return res.json({ success: true, data: result });
    } catch (error) {
      return next(error);
    }
  },
);

router.get(
  '/hosts/:userId/analytics',
  authMiddleware,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;

      if (userId !== req.userId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only access your own analytics',
            statusCode: 403,
          },
        });
      }

      const analytics = await service.getEventAnalytics(userId);
      return res.json({ success: true, data: analytics });
    } catch (error) {
      return next(error);
    }
  },
);

router.get(
  '/hosts/:userId/player-ratings',
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
            message: 'You can only access your own player ratings',
            statusCode: 403,
          },
        });
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const result = await service.getPlayerRatings(userId, limit, offset);
      return res.json({ success: true, data: result });
    } catch (error) {
      return next(error);
    }
  },
);

router.get(
  '/hosts/:userId/reviews',
  authMiddleware,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;

      if (userId !== req.userId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only access your own reviews',
            statusCode: 403,
          },
        });
      }

      const reviewStats = await service.getReviewStats(userId);
      return res.json({ success: true, data: reviewStats });
    } catch (error) {
      return next(error);
    }
  },
);

export default router;
