import EventService from './event.service';
import EventRepository from './event.repository';
import { NotFoundError, ConflictError, ValidationError } from '../../utils/errors';

jest.mock('./event.repository');

describe('EventService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createEvent', () => {
    it('should successfully create a new event', async () => {
      const mockEvent = {
        id: 'event-123',
        title: 'Friendly Match',
        type: 'game',
        location: 'Central Park',
        city: 'New York',
        start_time: new Date('2026-08-01T10:00:00Z'),
        end_time: new Date('2026-08-01T11:30:00Z'),
        host_id: 'user-123',
        max_participants: 22,
        current_participants: 0,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (EventRepository.createEvent as jest.Mock).mockResolvedValue(mockEvent);

      const result = await EventService.createEvent('user-123', {
        title: 'Friendly Match',
        type: 'game',
        location: 'Central Park',
        city: 'New York',
        start_time: new Date('2026-08-01T10:00:00Z'),
        end_time: new Date('2026-08-01T11:30:00Z'),
        max_participants: 22,
      });

      expect(result).toEqual(mockEvent);
      expect(EventRepository.createEvent).toHaveBeenCalled();
    });

    it('should throw error if end time is before start time', async () => {
      await expect(
        EventService.createEvent('user-123', {
          title: 'Bad Event',
          type: 'game',
          location: 'Park',
          city: 'NYC',
          start_time: new Date('2026-08-01T11:00:00Z'),
          end_time: new Date('2026-08-01T10:00:00Z'),
          max_participants: 22,
        }),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getEventById', () => {
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

      (EventRepository.getEventById as jest.Mock).mockResolvedValue(mockEvent);

      const result = await EventService.getEventById('event-123');

      expect(result).toEqual(mockEvent);
      expect(EventRepository.getEventById).toHaveBeenCalledWith('event-123');
    });

    it('should throw NotFoundError if event not found', async () => {
      (EventRepository.getEventById as jest.Mock).mockResolvedValue(null);

      await expect(EventService.getEventById('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('listEvents', () => {
    it('should return events with pagination', async () => {
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

      (EventRepository.listEvents as jest.Mock).mockResolvedValue({
        events: mockEvents,
        total: 1,
      });

      const result = await EventService.listEvents({ page: 1, limit: 20 });

      expect(result.events).toEqual(mockEvents);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('should filter events by city', async () => {
      (EventRepository.listEvents as jest.Mock).mockResolvedValue({
        events: [],
        total: 0,
      });

      await EventService.listEvents({ city: 'NYC', page: 1, limit: 20 });

      expect(EventRepository.listEvents).toHaveBeenCalledWith(
        expect.objectContaining({ city: 'NYC' }),
      );
    });
  });

  describe('updateEvent', () => {
    it('should update event when user is host', async () => {
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

      (EventRepository.getEventById as jest.Mock).mockResolvedValue(mockEvent);
      (EventRepository.updateEvent as jest.Mock).mockResolvedValue({
        ...mockEvent,
        title: 'Updated Match',
      });

      await EventService.updateEvent('event-123', 'user-123', { title: 'Updated Match' });

      expect(EventRepository.updateEvent).toHaveBeenCalled();
    });

    it('should throw error if user is not host', async () => {
      const mockEvent = {
        id: 'event-123',
        title: 'Match',
        type: 'game',
        location: 'Park',
        city: 'NYC',
        start_time: new Date(),
        end_time: new Date(),
        host_id: 'user-456',
        max_participants: 22,
        current_participants: 0,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (EventRepository.getEventById as jest.Mock).mockResolvedValue(mockEvent);

      await expect(
        EventService.updateEvent('event-123', 'user-123', { title: 'Updated' }),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('deleteEvent', () => {
    it('should delete event when user is host', async () => {
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

      (EventRepository.getEventById as jest.Mock).mockResolvedValue(mockEvent);
      (EventRepository.deleteEvent as jest.Mock).mockResolvedValue(undefined);

      await EventService.deleteEvent('event-123', 'user-123');

      expect(EventRepository.deleteEvent).toHaveBeenCalledWith('event-123');
    });
  });

  describe('joinEvent', () => {
    it('should add user as participant', async () => {
      const mockEvent = {
        id: 'event-123',
        title: 'Match',
        type: 'game',
        location: 'Park',
        city: 'NYC',
        start_time: new Date(),
        end_time: new Date(),
        host_id: 'user-456',
        max_participants: 22,
        current_participants: 10,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockParticipation = {
        id: 'part-123',
        user_id: 'user-123',
        event_id: 'event-123',
        status: 'pending',
        joined_at: new Date(),
        updated_at: new Date(),
      };

      (EventRepository.getEventById as jest.Mock).mockResolvedValue(mockEvent);
      (EventRepository.isParticipant as jest.Mock).mockResolvedValue(false);
      (EventRepository.addParticipant as jest.Mock).mockResolvedValue(mockParticipation);

      const result = await EventService.joinEvent('user-123', 'event-123');

      expect(result).toEqual(mockParticipation);
    });

    it('should throw error if user already joined', async () => {
      const mockEvent = {
        id: 'event-123',
        title: 'Match',
        type: 'game',
        location: 'Park',
        city: 'NYC',
        start_time: new Date(),
        end_time: new Date(),
        host_id: 'user-456',
        max_participants: 22,
        current_participants: 10,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (EventRepository.getEventById as jest.Mock).mockResolvedValue(mockEvent);
      (EventRepository.isParticipant as jest.Mock).mockResolvedValue(true);

      await expect(EventService.joinEvent('user-123', 'event-123')).rejects.toThrow(
        ConflictError,
      );
    });

    it('should throw error if event is full', async () => {
      const mockEvent = {
        id: 'event-123',
        title: 'Match',
        type: 'game',
        location: 'Park',
        city: 'NYC',
        start_time: new Date(),
        end_time: new Date(),
        host_id: 'user-456',
        max_participants: 22,
        current_participants: 22,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (EventRepository.getEventById as jest.Mock).mockResolvedValue(mockEvent);
      (EventRepository.isParticipant as jest.Mock).mockResolvedValue(false);

      await expect(EventService.joinEvent('user-123', 'event-123')).rejects.toThrow(
        ConflictError,
      );
    });
  });

  describe('leaveEvent', () => {
    it('should remove user from event', async () => {
      (EventRepository.isParticipant as jest.Mock).mockResolvedValue(true);
      (EventRepository.removeParticipant as jest.Mock).mockResolvedValue(undefined);

      await EventService.leaveEvent('user-123', 'event-123');

      expect(EventRepository.removeParticipant).toHaveBeenCalledWith('user-123', 'event-123');
    });

    it('should throw error if user not part of event', async () => {
      (EventRepository.isParticipant as jest.Mock).mockResolvedValue(false);

      await expect(EventService.leaveEvent('user-123', 'event-123')).rejects.toThrow(
        NotFoundError,
      );
    });
  });
});
