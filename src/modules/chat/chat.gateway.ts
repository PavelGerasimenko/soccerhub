import { Server as HTTPServer } from 'http';
import { Socket, Server as SocketServer } from 'socket.io';
import ChatService from './chat.service';
import { verifyAccessToken } from '../../utils/jwt';
import { JwtPayload } from '../../types/user.interface';

interface AuthSocket extends Socket {
  userId?: string;
  email?: string;
}

export class ChatGateway {
  private io: SocketServer;
  private userRooms: Map<string, Set<string>> = new Map();

  constructor(httpServer: HTTPServer) {
    this.io = new SocketServer(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
        credentials: true,
      },
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware(): void {
    this.io.use((socket: AuthSocket, next) => {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error'));
      }

      const payload = verifyAccessToken(token);
      if (!payload) {
        return next(new Error('Invalid token'));
      }

      socket.userId = payload.id;
      socket.email = payload.email;
      next();
    });
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: AuthSocket) => {
      console.log(`User ${socket.userId} connected: ${socket.id}`);

      // Join room
      socket.on('join_room', async (roomId: string) => {
        try {
          await ChatService.getRoomById(roomId);
          socket.join(roomId);

          // Set user as online
          await ChatService.setUserPresence(socket.userId!, roomId, 'online');

          // Notify others
          this.io.to(roomId).emit('user_joined', {
            userId: socket.userId,
            timestamp: new Date(),
          });

          // Send participant list
          const participants = await ChatService.getRoomParticipants(roomId);
          socket.emit('participants_list', participants);

          console.log(`User ${socket.userId} joined room ${roomId}`);
        } catch (error) {
          socket.emit('error', { message: 'Failed to join room' });
        }
      });

      // Send message
      socket.on('send_message', async (roomId: string, data: any) => {
        try {
          const message = await ChatService.sendMessage(roomId, socket.userId!, {
            content: data.content,
            message_type: data.message_type || 'text',
          });

          // Broadcast to room
          this.io.to(roomId).emit('new_message', {
            id: message.id,
            room_id: message.room_id,
            user_id: message.user_id,
            content: message.content,
            message_type: message.message_type,
            created_at: message.created_at,
          });

          // Clear typing indicator
          await ChatService.clearTypingIndicator(roomId, socket.userId!);
          this.io.to(roomId).emit('user_stopped_typing', socket.userId);
        } catch (error) {
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Edit message
      socket.on('edit_message', async (messageId: string, content: string) => {
        try {
          const message = await ChatService.editMessage(messageId, socket.userId!, content);

          this.io.emit('message_edited', {
            id: message.id,
            content: message.content,
            edited_at: message.edited_at,
          });
        } catch (error) {
          socket.emit('error', { message: 'Failed to edit message' });
        }
      });

      // Delete message
      socket.on('delete_message', async (messageId: string) => {
        try {
          await ChatService.deleteMessage(messageId);
          this.io.emit('message_deleted', { id: messageId });
        } catch (error) {
          socket.emit('error', { message: 'Failed to delete message' });
        }
      });

      // Add reaction
      socket.on('add_reaction', async (messageId: string, emoji: string) => {
        try {
          const reaction = await ChatService.addReaction(messageId, socket.userId!, {
            emoji,
          });

          this.io.emit('reaction_added', {
            message_id: messageId,
            user_id: socket.userId,
            emoji,
          });
        } catch (error) {
          socket.emit('error', { message: 'Failed to add reaction' });
        }
      });

      // Remove reaction
      socket.on('remove_reaction', async (messageId: string, emoji: string) => {
        try {
          await ChatService.removeReaction(messageId, socket.userId!, emoji);

          this.io.emit('reaction_removed', {
            message_id: messageId,
            user_id: socket.userId,
            emoji,
          });
        } catch (error) {
          socket.emit('error', { message: 'Failed to remove reaction' });
        }
      });

      // Typing indicator
      socket.on('typing', async (roomId: string) => {
        try {
          await ChatService.setTypingIndicator(roomId, socket.userId!);

          socket.to(roomId).emit('user_typing', {
            userId: socket.userId,
          });
        } catch (error) {
          // Silently fail for typing indicators
        }
      });

      // Stop typing
      socket.on('stop_typing', async (roomId: string) => {
        try {
          await ChatService.clearTypingIndicator(roomId, socket.userId!);

          socket.to(roomId).emit('user_stopped_typing', socket.userId);
        } catch (error) {
          // Silently fail
        }
      });

      // Leave room
      socket.on('leave_room', async (roomId: string) => {
        try {
          await ChatService.removeUserFromRoom(socket.userId!, roomId);
          socket.leave(roomId);

          this.io.to(roomId).emit('user_left', {
            userId: socket.userId,
            timestamp: new Date(),
          });

          console.log(`User ${socket.userId} left room ${roomId}`);
        } catch (error) {
          socket.emit('error', { message: 'Failed to leave room' });
        }
      });

      // Disconnect
      socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected: ${socket.id}`);
      });
    });
  }

  getIO(): SocketServer {
    return this.io;
  }
}

export default ChatGateway;
