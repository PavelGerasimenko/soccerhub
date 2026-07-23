-- Users schema for SoccerHub
CREATE SCHEMA IF NOT EXISTS users;

-- Create users table
CREATE TABLE IF NOT EXISTS users.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  profile_picture VARCHAR(500),
  bio TEXT,
  gender VARCHAR(20),
  skill_level VARCHAR(50),
  preferred_positions TEXT[],
  location VARCHAR(255),
  rating DECIMAL(3, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX idx_users_email ON users.users(email);
CREATE INDEX idx_users_created_at ON users.users(created_at DESC);
CREATE INDEX idx_users_is_active ON users.users(is_active);

-- Create user preferences table
CREATE TABLE IF NOT EXISTS users.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
  notification_email BOOLEAN DEFAULT true,
  notification_sms BOOLEAN DEFAULT false,
  notification_push BOOLEAN DEFAULT true,
  language VARCHAR(10) DEFAULT 'en',
  timezone VARCHAR(50) DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Create user refresh tokens table for JWT management
CREATE TABLE IF NOT EXISTS users.refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_revoked BOOLEAN DEFAULT false
);

-- Create index for token lookup
CREATE INDEX idx_refresh_tokens_user_id ON users.refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON users.refresh_tokens(expires_at);

-- Create reviews table for user ratings
CREATE TABLE IF NOT EXISTS users.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
  event_id UUID,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CHECK (reviewer_id != reviewee_id)
);

-- Create indexes for reviews
CREATE INDEX idx_reviews_reviewee_id ON users.reviews(reviewee_id);
CREATE INDEX idx_reviews_reviewer_id ON users.reviews(reviewer_id);
CREATE INDEX idx_reviews_created_at ON users.reviews(created_at DESC);

-- Events schema for Phase 2
CREATE SCHEMA IF NOT EXISTS events;

-- Create events table
CREATE TABLE IF NOT EXISTS events.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL CHECK (type IN ('game', 'tournament', 'league')),
  location VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  field_id UUID,
  host_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
  min_participants INTEGER DEFAULT 2,
  max_participants INTEGER NOT NULL,
  current_participants INTEGER DEFAULT 0,
  skill_level VARCHAR(50),
  surface_type VARCHAR(50),
  price DECIMAL(10, 2) DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for events
CREATE INDEX idx_events_host_id ON events.events(host_id);
CREATE INDEX idx_events_city ON events.events(city);
CREATE INDEX idx_events_start_time ON events.events(start_time);
CREATE INDEX idx_events_status ON events.events(status);
CREATE INDEX idx_events_is_active ON events.events(is_active);
CREATE INDEX idx_events_skill_level ON events.events(skill_level);
CREATE INDEX idx_events_type ON events.events(type);

-- Participation table for users joining events
CREATE TABLE IF NOT EXISTS events.participation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events.events(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  preferred_position VARCHAR(50),
  team_assignment VARCHAR(50),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, event_id)
);

-- Create indexes for participation
CREATE INDEX idx_participation_user_id ON events.participation(user_id);
CREATE INDEX idx_participation_event_id ON events.participation(event_id);
CREATE INDEX idx_participation_status ON events.participation(status);
CREATE INDEX idx_participation_joined_at ON events.participation(joined_at DESC);

-- Bookings schema for Phase 3
CREATE SCHEMA IF NOT EXISTS bookings;

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events.events(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  amount DECIMAL(10, 2) NOT NULL,
  payment_id UUID,
  host_commission DECIMAL(10, 2) DEFAULT 0,
  booking_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  confirmation_date TIMESTAMP WITH TIME ZONE,
  cancellation_date TIMESTAMP WITH TIME ZONE,
  cancellation_reason VARCHAR(255),
  refund_amount DECIMAL(10, 2),
  refunded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, event_id)
);

-- Create indexes for bookings
CREATE INDEX idx_bookings_user_id ON bookings.bookings(user_id);
CREATE INDEX idx_bookings_event_id ON bookings.bookings(event_id);
CREATE INDEX idx_bookings_status ON bookings.bookings(status);
CREATE INDEX idx_bookings_payment_id ON bookings.bookings(payment_id);
CREATE INDEX idx_bookings_booking_date ON bookings.bookings(booking_date DESC);

-- Create payments table
CREATE TABLE IF NOT EXISTS bookings.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings.bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events.events(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  payment_method VARCHAR(50),
  transaction_id VARCHAR(255),
  payment_gateway VARCHAR(100),
  host_commission DECIMAL(10, 2) DEFAULT 0,
  platform_fee DECIMAL(10, 2) DEFAULT 0,
  host_payout DECIMAL(10, 2),
  payment_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  failed_reason VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for payments
CREATE INDEX idx_payments_booking_id ON bookings.payments(booking_id);
CREATE INDEX idx_payments_user_id ON bookings.payments(user_id);
CREATE INDEX idx_payments_host_id ON bookings.payments(host_id);
CREATE INDEX idx_payments_status ON bookings.payments(status);
CREATE INDEX idx_payments_transaction_id ON bookings.payments(transaction_id);
CREATE INDEX idx_payments_payment_date ON bookings.payments(payment_date DESC);

-- Create refunds table
CREATE TABLE IF NOT EXISTS bookings.refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings.bookings(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL REFERENCES bookings.payments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  reason VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'rejected')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for refunds
CREATE INDEX idx_refunds_booking_id ON bookings.refunds(booking_id);
CREATE INDEX idx_refunds_user_id ON bookings.refunds(user_id);
CREATE INDEX idx_refunds_status ON bookings.refunds(status);
CREATE INDEX idx_refunds_requested_at ON bookings.refunds(requested_at DESC);

-- Create host earnings table for tracking commissions
CREATE TABLE IF NOT EXISTS bookings.host_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events.events(id) ON DELETE CASCADE,
  total_bookings INTEGER DEFAULT 0,
  total_amount DECIMAL(10, 2) DEFAULT 0,
  commission_rate DECIMAL(5, 2) DEFAULT 15,
  total_commission DECIMAL(10, 2) DEFAULT 0,
  platform_fee DECIMAL(10, 2) DEFAULT 0,
  net_earnings DECIMAL(10, 2) DEFAULT 0,
  paid_out DECIMAL(10, 2) DEFAULT 0,
  pending_payout DECIMAL(10, 2) DEFAULT 0,
  last_payout_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for host earnings
CREATE INDEX idx_host_earnings_host_id ON bookings.host_earnings(host_id);
CREATE INDEX idx_host_earnings_event_id ON bookings.host_earnings(event_id);

-- Chat schema for Phase 4
CREATE SCHEMA IF NOT EXISTS chat;

-- Create chat rooms table
CREATE TABLE IF NOT EXISTS chat.chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events.events(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  room_type VARCHAR(50) NOT NULL DEFAULT 'event' CHECK (room_type IN ('event', 'direct', 'group')),
  created_by UUID NOT NULL REFERENCES users.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for chat rooms
CREATE INDEX idx_chat_rooms_event_id ON chat.chat_rooms(event_id);
CREATE INDEX idx_chat_rooms_room_type ON chat.chat_rooms(room_type);
CREATE INDEX idx_chat_rooms_created_at ON chat.chat_rooms(created_at DESC);

-- Create chat messages table
CREATE TABLE IF NOT EXISTS chat.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES chat.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  message_type VARCHAR(50) NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  is_deleted BOOLEAN DEFAULT false,
  edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for messages
CREATE INDEX idx_messages_room_id ON chat.messages(room_id);
CREATE INDEX idx_messages_user_id ON chat.messages(user_id);
CREATE INDEX idx_messages_created_at ON chat.messages(created_at DESC);
CREATE INDEX idx_messages_is_deleted ON chat.messages(is_deleted);

-- Create message reactions table
CREATE TABLE IF NOT EXISTS chat.message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES chat.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(message_id, user_id, emoji)
);

-- Create indexes for reactions
CREATE INDEX idx_reactions_message_id ON chat.message_reactions(message_id);
CREATE INDEX idx_reactions_user_id ON chat.message_reactions(user_id);

-- Create user presence table
CREATE TABLE IF NOT EXISTS chat.user_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES chat.chat_rooms(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'away', 'offline')),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, room_id)
);

-- Create indexes for presence
CREATE INDEX idx_presence_user_id ON chat.user_presence(user_id);
CREATE INDEX idx_presence_room_id ON chat.user_presence(room_id);
CREATE INDEX idx_presence_status ON chat.user_presence(status);

-- Create typing indicators table
CREATE TABLE IF NOT EXISTS chat.typing_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES chat.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP + INTERVAL '5 seconds',
  UNIQUE(room_id, user_id)
);

-- Create indexes for typing indicators
CREATE INDEX idx_typing_room_id ON chat.typing_indicators(room_id);
CREATE INDEX idx_typing_expires_at ON chat.typing_indicators(expires_at);

-- Email Notifications schema for Phase 6
-- Create notification preferences table
CREATE TABLE IF NOT EXISTS users.notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES users.users(id) ON DELETE CASCADE,
  email_welcome BOOLEAN DEFAULT true,
  email_booking_confirmation BOOLEAN DEFAULT true,
  email_booking_cancellation BOOLEAN DEFAULT true,
  email_event_reminder BOOLEAN DEFAULT true,
  email_event_completed BOOLEAN DEFAULT true,
  email_host_review BOOLEAN DEFAULT true,
  email_player_review BOOLEAN DEFAULT true,
  email_event_updates BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for notification preferences
CREATE INDEX idx_notification_preferences_user_id ON users.notification_preferences(user_id);
CREATE INDEX idx_notification_preferences_updated_at ON users.notification_preferences(updated_at DESC);

-- Create email audit log table
CREATE TABLE IF NOT EXISTS users.email_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
  recipient_email VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('sent', 'failed', 'bounced')),
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for email audit log
CREATE INDEX idx_email_audit_user_id ON users.email_audit_log(user_id);
CREATE INDEX idx_email_audit_type ON users.email_audit_log(type);
CREATE INDEX idx_email_audit_status ON users.email_audit_log(status);
CREATE INDEX idx_email_audit_sent_at ON users.email_audit_log(sent_at DESC);
CREATE INDEX idx_email_audit_recipient ON users.email_audit_log(recipient_email);
