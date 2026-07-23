import { Router } from 'express';
import { query as queryParam } from 'express-validator';
import ChatService from './chat.service';
import { authMiddleware, AuthRequest } from '../../middleware/auth';
import { handleValidationErrors } from '../../middleware/validation';

const router = Router();

// GET /api/v1/chat/rooms/:eventId - Get or create room for event
router.get(
  '/chat/rooms/:eventId',
  authMiddleware,
  async (req: AuthRequest, res: any, next: any) => {
    try {
      const room = await ChatService.getOrCreateRoomForEvent(
        req.params.eventId,
        req.userId!,
      );

      res.status(200).json({
        success: true,
        data: room,
      });
    } catch (error) {
      next(error);
    }
  },
);

// GET /api/v1/chat/rooms/:roomId/messages - Get room messages
router.get(
  '/chat/rooms/:roomId/messages',
  authMiddleware,
  [
    queryParam('limit').optional().isInt({ min: 1, max: 100 }),
    queryParam('offset').optional().isInt({ min: 0 }),
  ] as any,
  handleValidationErrors,
  async (req: AuthRequest, res: any, next: any) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const messages = await ChatService.getMessages(req.params.roomId, limit, offset);

      res.status(200).json({
        success: true,
        data: messages,
      });
    } catch (error) {
      next(error);
    }
  },
);

// GET /api/v1/chat/rooms/:roomId/participants - Get room participants
router.get(
  '/chat/rooms/:roomId/participants',
  authMiddleware,
  async (req: AuthRequest, res: any, next: any) => {
    try {
      const participants = await ChatService.getRoomParticipants(req.params.roomId);

      res.status(200).json({
        success: true,
        data: participants,
      });
    } catch (error) {
      next(error);
    }
  },
);

// GET /api/v1/chat/rooms/:roomId/typing - Get users typing in room
router.get(
  '/chat/rooms/:roomId/typing',
  authMiddleware,
  async (req: AuthRequest, res: any, next: any) => {
    try {
      const typingUsers = await ChatService.getTypingUsers(req.params.roomId);

      res.status(200).json({
        success: true,
        data: typingUsers,
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
