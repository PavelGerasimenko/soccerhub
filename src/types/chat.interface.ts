export type RoomType = 'event' | 'direct' | 'group';
export type MessageType = 'text' | 'image' | 'file' | 'system';
export type UserStatus = 'online' | 'away' | 'offline';

export interface ChatRoom {
  id: string;
  event_id: string;
  name: string;
  description?: string;
  room_type: RoomType;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface Message {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  message_type: MessageType;
  is_deleted: boolean;
  edited_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: Date;
}

export interface UserPresence {
  id: string;
  user_id: string;
  room_id: string;
  status: UserStatus;
  last_seen: Date;
  created_at: Date;
  updated_at: Date;
}

export interface TypingIndicator {
  id: string;
  room_id: string;
  user_id: string;
  started_at: Date;
  expires_at: Date;
}

export interface CreateMessageRequest {
  content: string;
  message_type?: MessageType;
}

export interface AddReactionRequest {
  emoji: string;
}

export interface UpdatePresenceRequest {
  status: UserStatus;
}

export interface MessageWithUser extends Message {
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    profile_picture?: string;
  };
  reactions?: MessageReaction[];
}

export interface RoomWithMessages extends ChatRoom {
  messages?: MessageWithUser[];
  participants?: UserPresence[];
}

export interface ChatEvent {
  type: 'message' | 'typing' | 'presence' | 'reaction';
  room_id: string;
  user_id: string;
  data: any;
  timestamp: Date;
}
