import ChatService from './chat.service';
import ChatRepository from './chat.repository';
import EventRepository from '../events/event.repository';
import { NotFoundError, ValidationError } from '../../utils/errors';

jest.mock('./chat.repository');
jest.mock('../events/event.repository');

describe('ChatService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrCreateRoomForEvent', () => {
    it('should create room if not exists', async () => {
      const mockEvent = {
        id: 'event-123',
        title: 'Soccer Match',
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

      const mockRoom = {
        id: 'room-123',
        event_id: 'event-123',
        name: 'Soccer Match Chat',
        room_type: 'event',
        created_by: 'user-123',
        created_at: new Date(),
        updated_at: new Date(),
      };

      (EventRepository.getEventById as jest.Mock).mockResolvedValue(mockEvent);
      (ChatRepository.getRoomByEventId as jest.Mock).mockResolvedValue(null);
      (ChatRepository.createRoom as jest.Mock).mockResolvedValue(mockRoom);

      const result = await ChatService.getOrCreateRoomForEvent('event-123', 'user-123');

      expect(result).toEqual(mockRoom);
      expect(ChatRepository.createRoom).toHaveBeenCalled();
    });

    it('should return existing room', async () => {
      const mockEvent = {
        id: 'event-123',
        title: 'Soccer Match',
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

      const mockRoom = {
        id: 'room-123',
        event_id: 'event-123',
        name: 'Soccer Match Chat',
        room_type: 'event',
        created_by: 'user-456',
        created_at: new Date(),
        updated_at: new Date(),
      };

      (EventRepository.getEventById as jest.Mock).mockResolvedValue(mockEvent);
      (ChatRepository.getRoomByEventId as jest.Mock).mockResolvedValue(mockRoom);

      const result = await ChatService.getOrCreateRoomForEvent('event-123', 'user-123');

      expect(result).toEqual(mockRoom);
      expect(ChatRepository.createRoom).not.toHaveBeenCalled();
    });

    it('should throw error if event not found', async () => {
      (EventRepository.getEventById as jest.Mock).mockResolvedValue(null);

      await expect(
        ChatService.getOrCreateRoomForEvent('nonexistent', 'user-123'),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('sendMessage', () => {
    it('should send message successfully', async () => {
      const mockRoom = {
        id: 'room-123',
        event_id: 'event-123',
        name: 'Chat',
        room_type: 'event',
        created_by: 'user-456',
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockMessage = {
        id: 'msg-123',
        room_id: 'room-123',
        user_id: 'user-123',
        content: 'Hello everyone!',
        message_type: 'text',
        is_deleted: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (ChatRepository.getRoomById as jest.Mock).mockResolvedValue(mockRoom);
      (ChatRepository.createMessage as jest.Mock).mockResolvedValue(mockMessage);

      const result = await ChatService.sendMessage('room-123', 'user-123', {
        content: 'Hello everyone!',
      });

      expect(result).toEqual(mockMessage);
    });

    it('should throw error for empty content', async () => {
      const mockRoom = {
        id: 'room-123',
        event_id: 'event-123',
        name: 'Chat',
        room_type: 'event',
        created_by: 'user-456',
        created_at: new Date(),
        updated_at: new Date(),
      };

      (ChatRepository.getRoomById as jest.Mock).mockResolvedValue(mockRoom);

      await expect(
        ChatService.sendMessage('room-123', 'user-123', { content: '' }),
      ).rejects.toThrow(ValidationError);
    });

    it('should throw error for content too long', async () => {
      const mockRoom = {
        id: 'room-123',
        event_id: 'event-123',
        name: 'Chat',
        room_type: 'event',
        created_by: 'user-456',
        created_at: new Date(),
        updated_at: new Date(),
      };

      (ChatRepository.getRoomById as jest.Mock).mockResolvedValue(mockRoom);

      const longContent = 'a'.repeat(5001);

      await expect(
        ChatService.sendMessage('room-123', 'user-123', { content: longContent }),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getMessages', () => {
    it('should get messages with pagination', async () => {
      const mockRoom = {
        id: 'room-123',
        event_id: 'event-123',
        name: 'Chat',
        room_type: 'event',
        created_by: 'user-456',
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockMessages = [
        {
          id: 'msg-1',
          room_id: 'room-123',
          user_id: 'user-123',
          content: 'Message 1',
          message_type: 'text',
          is_deleted: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      (ChatRepository.getRoomById as jest.Mock).mockResolvedValue(mockRoom);
      (ChatRepository.getMessages as jest.Mock).mockResolvedValue(mockMessages);

      const result = await ChatService.getMessages('room-123', 50, 0);

      expect(result).toEqual(mockMessages);
    });
  });

  describe('addReaction', () => {
    it('should add reaction successfully', async () => {
      const mockReaction = {
        id: 'react-123',
        message_id: 'msg-123',
        user_id: 'user-123',
        emoji: '👍',
        created_at: new Date(),
      };

      (ChatRepository.addReaction as jest.Mock).mockResolvedValue(mockReaction);

      const result = await ChatService.addReaction('msg-123', 'user-123', {
        emoji: '👍',
      });

      expect(result).toEqual(mockReaction);
    });

    it('should throw error for empty emoji', async () => {
      await expect(
        ChatService.addReaction('msg-123', 'user-123', { emoji: '' }),
      ).rejects.toThrow(ValidationError);
    });
  });
});
