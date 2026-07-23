import { query } from '../../config/database';
import { ChatRoom, Message, MessageReaction, UserPresence, TypingIndicator } from '../../types/chat.interface';
import { generateId } from '../../utils/id';

export class ChatRepository {
  async createRoom(
    eventId: string,
    name: string,
    createdBy: string,
    roomType: string = 'event',
  ): Promise<ChatRoom> {
    const id = generateId();
    const now = new Date();

    const result = await query(
      `INSERT INTO chat.chat_rooms (id, event_id, name, room_type, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, event_id, name, description, room_type, created_by, created_at, updated_at`,
      [id, eventId, name, roomType, createdBy, now, now],
    );

    return result.rows[0] as ChatRoom;
  }

  async getRoomById(id: string): Promise<ChatRoom | null> {
    const result = await query(
      `SELECT id, event_id, name, description, room_type, created_by, created_at, updated_at
      FROM chat.chat_rooms WHERE id = $1`,
      [id],
    );

    return result.rows[0] || null;
  }

  async getRoomByEventId(eventId: string): Promise<ChatRoom | null> {
    const result = await query(
      `SELECT id, event_id, name, description, room_type, created_by, created_at, updated_at
      FROM chat.chat_rooms WHERE event_id = $1`,
      [eventId],
    );

    return result.rows[0] || null;
  }

  async createMessage(
    roomId: string,
    userId: string,
    content: string,
    messageType: string = 'text',
  ): Promise<Message> {
    const id = generateId();
    const now = new Date();

    const result = await query(
      `INSERT INTO chat.messages (id, room_id, user_id, content, message_type, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, room_id, user_id, content, message_type, is_deleted, edited_at, created_at, updated_at`,
      [id, roomId, userId, content, messageType, now, now],
    );

    return result.rows[0] as Message;
  }

  async getMessages(roomId: string, limit: number = 50, offset: number = 0): Promise<Message[]> {
    const result = await query(
      `SELECT id, room_id, user_id, content, message_type, is_deleted, edited_at, created_at, updated_at
      FROM chat.messages WHERE room_id = $1 AND is_deleted = false
      ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [roomId, limit, offset],
    );

    return result.rows.reverse() as Message[];
  }

  async updateMessage(id: string, content: string): Promise<Message> {
    const now = new Date();

    const result = await query(
      `UPDATE chat.messages SET content = $1, edited_at = $2, updated_at = $2
      WHERE id = $3
      RETURNING id, room_id, user_id, content, message_type, is_deleted, edited_at, created_at, updated_at`,
      [content, now, id],
    );

    return result.rows[0] as Message;
  }

  async deleteMessage(id: string): Promise<void> {
    await query(
      `UPDATE chat.messages SET is_deleted = true, updated_at = $1 WHERE id = $2`,
      [new Date(), id],
    );
  }

  async addReaction(messageId: string, userId: string, emoji: string): Promise<MessageReaction> {
    const id = generateId();
    const now = new Date();

    const result = await query(
      `INSERT INTO chat.message_reactions (id, message_id, user_id, emoji, created_at)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (message_id, user_id, emoji) DO NOTHING
      RETURNING id, message_id, user_id, emoji, created_at`,
      [id, messageId, userId, emoji, now],
    );

    return result.rows[0] as MessageReaction;
  }

  async removeReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    await query(
      `DELETE FROM chat.message_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3`,
      [messageId, userId, emoji],
    );
  }

  async getMessageReactions(messageId: string): Promise<MessageReaction[]> {
    const result = await query(
      `SELECT id, message_id, user_id, emoji, created_at
      FROM chat.message_reactions WHERE message_id = $1`,
      [messageId],
    );

    return result.rows as MessageReaction[];
  }

  async setUserPresence(userId: string, roomId: string, status: string): Promise<UserPresence> {
    const id = generateId();
    const now = new Date();

    const result = await query(
      `INSERT INTO chat.user_presence (id, user_id, room_id, status, last_seen, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (user_id, room_id) DO UPDATE
      SET status = $4, last_seen = $5, updated_at = $7
      RETURNING id, user_id, room_id, status, last_seen, created_at, updated_at`,
      [id, userId, roomId, status, now, now, now],
    );

    return result.rows[0] as UserPresence;
  }

  async getUserPresence(userId: string, roomId: string): Promise<UserPresence | null> {
    const result = await query(
      `SELECT id, user_id, room_id, status, last_seen, created_at, updated_at
      FROM chat.user_presence WHERE user_id = $1 AND room_id = $2`,
      [userId, roomId],
    );

    return result.rows[0] || null;
  }

  async getRoomParticipants(roomId: string): Promise<UserPresence[]> {
    const result = await query(
      `SELECT id, user_id, room_id, status, last_seen, created_at, updated_at
      FROM chat.user_presence WHERE room_id = $1 ORDER BY last_seen DESC`,
      [roomId],
    );

    return result.rows as UserPresence[];
  }

  async removeUserPresence(userId: string, roomId: string): Promise<void> {
    await query(
      `DELETE FROM chat.user_presence WHERE user_id = $1 AND room_id = $2`,
      [userId, roomId],
    );
  }

  async setTypingIndicator(roomId: string, userId: string): Promise<TypingIndicator> {
    const id = generateId();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5000); // 5 seconds

    const result = await query(
      `INSERT INTO chat.typing_indicators (id, room_id, user_id, started_at, expires_at)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (room_id, user_id) DO UPDATE
      SET started_at = $4, expires_at = $5
      RETURNING id, room_id, user_id, started_at, expires_at`,
      [id, roomId, userId, now, expiresAt],
    );

    return result.rows[0] as TypingIndicator;
  }

  async clearTypingIndicator(roomId: string, userId: string): Promise<void> {
    await query(
      `DELETE FROM chat.typing_indicators WHERE room_id = $1 AND user_id = $2`,
      [roomId, userId],
    );
  }

  async getTypingUsers(roomId: string): Promise<TypingIndicator[]> {
    const result = await query(
      `SELECT id, room_id, user_id, started_at, expires_at
      FROM chat.typing_indicators WHERE room_id = $1 AND expires_at > NOW()`,
      [roomId],
    );

    return result.rows as TypingIndicator[];
  }
}

export default new ChatRepository();
