import ChatRepository from './chat.repository';
import EventRepository from '../events/event.repository';
import { ChatRoom, Message, MessageReaction, UserPresence, CreateMessageRequest, AddReactionRequest } from '../../types/chat.interface';
import { NotFoundError, ValidationError } from '../../utils/errors';

export class ChatService {
  async getOrCreateRoomForEvent(eventId: string, userId: string): Promise<ChatRoom> {
    // Check if event exists
    const event = await EventRepository.getEventById(eventId);
    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Check if room exists
    let room = await ChatRepository.getRoomByEventId(eventId);
    if (!room) {
      room = await ChatRepository.createRoom(eventId, `${event.title} Chat`, userId);
    }

    return room;
  }

  async getRoomById(id: string): Promise<ChatRoom> {
    const room = await ChatRepository.getRoomById(id);
    if (!room) {
      throw new NotFoundError('Chat room not found');
    }
    return room;
  }

  async sendMessage(roomId: string, userId: string, data: CreateMessageRequest): Promise<Message> {
    // Verify room exists
    const room = await this.getRoomById(roomId);

    // Validate content
    if (!data.content || data.content.trim().length === 0) {
      throw new ValidationError('Message content is required');
    }

    if (data.content.length > 5000) {
      throw new ValidationError('Message is too long (max 5000 characters)');
    }

    // Create message
    const message = await ChatRepository.createMessage(
      roomId,
      userId,
      data.content.trim(),
      data.message_type || 'text',
    );

    return message;
  }

  async getMessages(roomId: string, limit: number = 50, offset: number = 0): Promise<Message[]> {
    // Verify room exists
    await this.getRoomById(roomId);

    // Validate pagination
    if (limit > 100) {
      limit = 100;
    }

    return ChatRepository.getMessages(roomId, limit, offset);
  }

  async editMessage(messageId: string, userId: string, content: string): Promise<Message> {
    if (!content || content.trim().length === 0) {
      throw new ValidationError('Message content is required');
    }

    if (content.length > 5000) {
      throw new ValidationError('Message is too long (max 5000 characters)');
    }

    const message = await ChatRepository.updateMessage(messageId, content.trim());
    return message;
  }

  async deleteMessage(messageId: string): Promise<void> {
    await ChatRepository.deleteMessage(messageId);
  }

  async addReaction(messageId: string, userId: string, data: AddReactionRequest): Promise<MessageReaction> {
    // Validate emoji
    if (!data.emoji || data.emoji.length === 0) {
      throw new ValidationError('Emoji is required');
    }

    return ChatRepository.addReaction(messageId, userId, data.emoji);
  }

  async removeReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    await ChatRepository.removeReaction(messageId, userId, emoji);
  }

  async setUserPresence(userId: string, roomId: string, status: string): Promise<UserPresence> {
    // Verify room exists
    await this.getRoomById(roomId);

    if (!['online', 'away', 'offline'].includes(status)) {
      throw new ValidationError('Invalid status');
    }

    return ChatRepository.setUserPresence(userId, roomId, status);
  }

  async getUserPresence(userId: string, roomId: string): Promise<UserPresence | null> {
    return ChatRepository.getUserPresence(userId, roomId);
  }

  async getRoomParticipants(roomId: string): Promise<UserPresence[]> {
    // Verify room exists
    await this.getRoomById(roomId);

    return ChatRepository.getRoomParticipants(roomId);
  }

  async removeUserFromRoom(userId: string, roomId: string): Promise<void> {
    // Verify room exists
    await this.getRoomById(roomId);

    await ChatRepository.removeUserPresence(userId, roomId);
  }

  async setTypingIndicator(roomId: string, userId: string): Promise<void> {
    // Verify room exists
    await this.getRoomById(roomId);

    await ChatRepository.setTypingIndicator(roomId, userId);
  }

  async clearTypingIndicator(roomId: string, userId: string): Promise<void> {
    await ChatRepository.clearTypingIndicator(roomId, userId);
  }

  async getTypingUsers(roomId: string): Promise<string[]> {
    // Verify room exists
    await this.getRoomById(roomId);

    const indicators = await ChatRepository.getTypingUsers(roomId);
    return indicators.map((ind) => ind.user_id);
  }
}

export default new ChatService();
