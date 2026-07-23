import request from 'supertest';
import app from '../../app';
import EventService from './event.service';
import * as jwtUtils from '../../utils/jwt';
import { NotFoundError, ConflictError } from '../../utils/errors';

jest.mock('./event.service');
jest.mock('../../utils/jwt');

describe('Event Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/events', () => {
    it('should list events with filters', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          title: 'Match 1',
          type: 'game',
          location: 'Park',
          city: 'NYC',
          start_time: new Date(),
          end_time: new Date(),
          host_id: 'user-1',
          max_participants: 22,
          current_participants: 0,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      (EventService.listEvents as jest.Mock).mockResolvedValue({
        events: mockEvents,
        total: 1,
        page: 1,
        pages: 1,
      });

      const response = await request(app)
        .get('/api/v1/events')
        .query({ city: 'NYC' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.events).toHaveLength(1);
    });
  });

  describe('POST /api/v1/events', () => {
    it('should create event when authenticated', async () => {
      const mockEvent = {
        id: 'event-123',
        title: 'Match',
        type: 'game',
        location: 'Park',
        city: 'NYC',
        start_time: new Date(),
        end_time: new Date(),
        host_id: 'user-123',
        max_participants: 22,
        current_participants: 0,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (jwtUtils.verifyAccessToken as jest.Mock).mockReturnValue({
        id: 'user-123',
        email: 'test@example.com',
      });
      (EventService.createEvent as jest.Mock).mockResolvedValue(mockEvent);

      const response = await request(app)
        .post('/api/v1/events')
        .set('Authorization', 'Bearer valid-token')
        .send({
          title: 'Match',
          type: 'game',
          location: 'Park',
          city: 'NYC',
          start_time: new Date(),
          end_time: new Date(),
          max_participants: 22,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('event-123');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/events')
        .send({
          title: 'Match',
          type: 'game',
          location: 'Park',
          city: 'NYC',
          start_time: new Date(),
          end_time: new Date(),
          max_participants: 22,
        });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/events')
        .set('Authorization', 'Bearer valid-token')
        .send({ title: 'Match' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/events/:id', () => {
    it('should return event by id', async () => {
      const mockEvent = {
        id: 'event-123',
        title: 'Match',
        type: 'game',
        location: 'Park',
        city: 'NYC',
        start_time: new Date(),
        end_time: new Date(),
        host_id: 'user-123',
        max_participants: 22,
        current_participants: 0,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (EventService.getEventById as jest.Mock).mockResolvedValue(mockEvent);

      const response = await request(app)
        .get('/api/v1/events/event-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Match');
    });

    it('should return 404 if event not found', async () => {
      (EventService.getEventById as jest.Mock).mockRejectedValue(
        new NotFoundError('Event not found'),
      );

      const response = await request(app)
        .get('/api/v1/events/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('PUT /api/v1/events/:id', () => {
    it('should update event when authenticated', async () => {
      const mockEvent = {
        id: 'event-123',
        title: 'Updated Match',
        type: 'game',
        location: 'Park',
        city: 'NYC',
        start_time: new Date(),
        end_time: new Date(),
        host_id: 'user-123',
        max_participants: 22,
        current_participants: 0,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (jwtUtils.verifyAccessToken as jest.Mock).mockReturnValue({
        id: 'user-123',
        email: 'test@example.com',
      });
      (EventService.updateEvent as jest.Mock).mockResolvedValue(mockEvent);

      const response = await request(app)
        .put('/api/v1/events/event-123')
        .set('Authorization', 'Bearer valid-token')
        .send({ title: 'Updated Match' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('DELETE /api/v1/events/:id', () => {
    it('should delete event when authenticated', async () => {
      (jwtUtils.verifyAccessToken as jest.Mock).mockReturnValue({
        id: 'user-123',
        email: 'test@example.com',
      });
      (EventService.deleteEvent as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/api/v1/events/event-123')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(204);
    });
  });

  describe('POST /api/v1/events/:id/join', () => {
    it('should join event', async () => {
      const mockParticipation = {
        id: 'part-123',
        user_id: 'user-123',
        event_id: 'event-123',
        status: 'pending',
        joined_at: new Date(),
        updated_at: new Date(),
      };

      (jwtUtils.verifyAccessToken as jest.Mock).mockReturnValue({
        id: 'user-123',
        email: 'test@example.com',
      });
      (EventService.joinEvent as jest.Mock).mockResolvedValue(mockParticipation);

      const response = await request(app)
        .post('/api/v1/events/event-123/join')
        .set('Authorization', 'Bearer valid-token')
        .send({});

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should return 409 if already joined', async () => {
      (jwtUtils.verifyAccessToken as jest.Mock).mockReturnValue({
        id: 'user-123',
        email: 'test@example.com',
      });
      (EventService.joinEvent as jest.Mock).mockRejectedValue(
        new ConflictError('Already joined'),
      );

      const response = await request(app)
        .post('/api/v1/events/event-123/join')
        .set('Authorization', 'Bearer valid-token')
        .send({});

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('CONFLICT');
    });
  });

  describe('DELETE /api/v1/events/:id/leave', () => {
    it('should leave event', async () => {
      (jwtUtils.verifyAccessToken as jest.Mock).mockReturnValue({
        id: 'user-123',
        email: 'test@example.com',
      });
      (EventService.leaveEvent as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/api/v1/events/event-123/leave')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(204);
    });
  });

  describe('GET /api/v1/events/:id/participants', () => {
    it('should get event participants', async () => {
      const mockParticipants = [
        {
          id: 'part-1',
          user_id: 'user-1',
          event_id: 'event-123',
          status: 'confirmed',
          joined_at: new Date(),
          updated_at: new Date(),
        },
      ];

      (EventService.getEventParticipants as jest.Mock).mockResolvedValue(mockParticipants);

      const response = await request(app)
        .get('/api/v1/events/event-123/participants');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });
  });
});
