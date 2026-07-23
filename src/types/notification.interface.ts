export enum NotificationType {
  WELCOME = 'welcome',
  BOOKING_CONFIRMATION = 'booking_confirmation',
  BOOKING_CANCELLED = 'booking_cancelled',
  EVENT_REMINDER = 'event_reminder',
  EVENT_COMPLETED = 'event_completed',
  HOST_REVIEW = 'host_review',
  PLAYER_REVIEW = 'player_review',
  EVENT_UPDATED = 'event_updated',
}

export interface NotificationPreferences {
  userId: string;
  emailWelcome: boolean;
  emailBookingConfirmation: boolean;
  emailBookingCancellation: boolean;
  emailEventReminder: boolean;
  emailEventCompleted: boolean;
  emailHostReview: boolean;
  emailPlayerReview: boolean;
  emailEventUpdates: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailTemplate {
  type: NotificationType;
  subject: string;
  htmlContent: string;
  textContent: string;
}

export interface EmailPayload {
  to: string;
  recipientName: string;
  type: NotificationType;
  data: Record<string, any>;
  userId: string;
}

export interface EmailAuditLog {
  id: string;
  userId: string;
  recipientEmail: string;
  type: NotificationType;
  subject: string;
  status: 'sent' | 'failed' | 'bounced';
  errorMessage?: string;
  sentAt: Date;
  openedAt?: Date;
  clickedAt?: Date;
}

export interface SendEmailRequest {
  type: NotificationType;
  data: Record<string, any>;
  userId?: string;
}

export interface UpdateNotificationPreferencesRequest {
  emailWelcome?: boolean;
  emailBookingConfirmation?: boolean;
  emailBookingCancellation?: boolean;
  emailEventReminder?: boolean;
  emailEventCompleted?: boolean;
  emailHostReview?: boolean;
  emailPlayerReview?: boolean;
  emailEventUpdates?: boolean;
}
