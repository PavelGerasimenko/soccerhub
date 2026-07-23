import { Router } from 'express';
import { body, query as queryParam } from 'express-validator';
import EventService from './event.service';
import { authMiddleware, optionalAuthMiddleware, AuthRequest } from '../../middleware/auth';
import { handleValidationErrors } from '../../middleware/validation';

const router = Router();

// GET /api/v1/events - List events with filters
router.get(
  '/events',
  optionalAuthMiddleware,
  [
    queryParam('city').optional().trim(),
    queryParam('type').optional().isIn(['game', 'tournament', 'league']),
    queryParam('skill_level').optional(),
    queryParam('surface_type').optional(),
    queryParam('search').optional().trim(),
    queryParam('page').optional().isInt({ min: 1 }),
    queryParam('limit').optional().isInt({ min: 1, max: 100 }),
    queryParam('sort').optional().isIn(['newest', 'oldest', 'soonest', 'price_low', 'price_high']),
  ] as any,
  handleValidationErrors,
  async (req: any, res: any, next: any) => {
    try {
      const filters = {
        city: req.query.city,
        type: req.query.type,
        skill_level: req.query.skill_level,
        surface_type: req.query.surface_type,
        search: req.query.search,
        page: req.query.page ? parseInt(req.query.page, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit, 10) : 20,
        sort: req.query.sort,
      };

      const result = await EventService.listEvents(filters);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
);

// POST /api/v1/events - Create event
router.post(
  '/events',
  authMiddleware,
  [
    body('title').notEmpty().trim().withMessage('Title is required'),
    body('type').isIn(['game', 'tournament', 'league']).withMessage('Invalid event type'),
    body('location').notEmpty().trim().withMessage('Location is required'),
    body('city').notEmpty().trim().withMessage('City is required'),
    body('start_time').isISO8601().withMessage('Valid start time required'),
    body('end_time').isISO8601().withMessage('Valid end time required'),
    body('max_participants').isInt({ min: 2 }).withMessage('Max participants must be at least 2'),
    body('min_participants').optional().isInt({ min: 1 }),
    body('skill_level').optional().isIn(['beginner', 'intermediate', 'advanced', 'professional']),
    body('surface_type').optional(),
    body('price').optional().isDecimal(),
  ] as any,
  handleValidationErrors,
  async (req: AuthRequest, res: any, next: any) => {
    try {
      const event = await EventService.createEvent(req.userId!, {
        title: req.body.title,
        type: req.body.type,
        location: req.body.location,
        city: req.body.city,
        start_time: new Date(req.body.start_time),
        end_time: new Date(req.body.end_time),
        max_participants: parseInt(req.body.max_participants, 10),
        description: req.body.description,
        min_participants: req.body.min_participants ? parseInt(req.body.min_participants, 10) : 2,
        skill_level: req.body.skill_level,
        surface_type: req.body.surface_type,
        price: req.body.price ? parseFloat(req.body.price) : 0,
      });

      res.status(201).json({
        success: true,
        data: event,
      });
    } catch (error) {
      next(error);
    }
  },
);

// GET /api/v1/events/:id - Get event details
router.get(
  '/events/:id',
  optionalAuthMiddleware,
  async (req: any, res: any, next: any) => {
    try {
      const event = await EventService.getEventById(req.params.id);
      res.status(200).json({
        success: true,
        data: event,
      });
    } catch (error) {
      next(error);
    }
  },
);

// PUT /api/v1/events/:id - Update event
router.put(
  '/events/:id',
  authMiddleware,
  [
    body('title').optional().notEmpty().trim(),
    body('location').optional().notEmpty().trim(),
    body('city').optional().notEmpty().trim(),
    body('start_time').optional().isISO8601(),
    body('end_time').optional().isISO8601(),
    body('max_participants').optional().isInt({ min: 2 }),
    body('skill_level').optional().isIn(['beginner', 'intermediate', 'advanced', 'professional']),
    body('price').optional().isDecimal(),
  ] as any,
  handleValidationErrors,
  async (req: AuthRequest, res: any, next: any) => {
    try {
      const event = await EventService.updateEvent(req.params.id, req.userId!, {
        title: req.body.title,
        description: req.body.description,
        location: req.body.location,
        city: req.body.city,
        start_time: req.body.start_time ? new Date(req.body.start_time) : undefined,
        end_time: req.body.end_time ? new Date(req.body.end_time) : undefined,
        max_participants: req.body.max_participants ? parseInt(req.body.max_participants, 10) : undefined,
        skill_level: req.body.skill_level,
        surface_type: req.body.surface_type,
        price: req.body.price ? parseFloat(req.body.price) : undefined,
      });

      res.status(200).json({
        success: true,
        data: event,
      });
    } catch (error) {
      next(error);
    }
  },
);

// DELETE /api/v1/events/:id - Delete event
router.delete(
  '/events/:id',
  authMiddleware,
  async (req: AuthRequest, res: any, next: any) => {
    try {
      await EventService.deleteEvent(req.params.id, req.userId!);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
);

// POST /api/v1/events/:id/join - Join event
router.post(
  '/events/:id/join',
  authMiddleware,
  [
    body('preferred_position').optional().trim(),
  ] as any,
  handleValidationErrors,
  async (req: AuthRequest, res: any, next: any) => {
    try {
      const participation = await EventService.joinEvent(
        req.userId!,
        req.params.id,
        req.body.preferred_position,
      );

      res.status(201).json({
        success: true,
        data: participation,
      });
    } catch (error) {
      next(error);
    }
  },
);

// DELETE /api/v1/events/:id/leave - Leave event
router.delete(
  '/events/:id/leave',
  authMiddleware,
  async (req: AuthRequest, res: any, next: any) => {
    try {
      await EventService.leaveEvent(req.userId!, req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
);

// GET /api/v1/events/:id/participants - Get event participants
router.get(
  '/events/:id/participants',
  async (req: any, res: any, next: any) => {
    try {
      const participants = await EventService.getEventParticipants(req.params.id);
      res.status(200).json({
        success: true,
        data: participants,
      });
    } catch (error) {
      next(error);
    }
  },
);

// POST /api/v1/events/:id/publish - Publish event
router.post(
  '/events/:id/publish',
  authMiddleware,
  async (req: AuthRequest, res: any, next: any) => {
    try {
      const event = await EventService.publishEvent(req.params.id, req.userId!);
      res.status(200).json({
        success: true,
        data: event,
      });
    } catch (error) {
      next(error);
    }
  },
);

// POST /api/v1/events/:id/cancel - Cancel event
router.post(
  '/events/:id/cancel',
  authMiddleware,
  async (req: AuthRequest, res: any, next: any) => {
    try {
      const event = await EventService.cancelEvent(req.params.id, req.userId!);
      res.status(200).json({
        success: true,
        data: event,
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
