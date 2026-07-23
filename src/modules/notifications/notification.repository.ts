import { Pool } from 'pg';
import pool from '../../config/database';
import { NotificationPreferences, EmailAuditLog } from '../../types/notification.interface';
import { v4 as uuidv4 } from 'uuid';

export default class NotificationRepository {
  private pool: Pool;

  constructor() {
    this.pool = pool;
  }

  async getPreferences(userId: string): Promise<NotificationPreferences | null> {
    const query = `
      SELECT
        user_id,
        email_welcome,
        email_booking_confirmation,
        email_booking_cancellation,
        email_event_reminder,
        email_event_completed,
        email_host_review,
        email_player_review,
        email_event_updates,
        created_at,
        updated_at
      FROM users.notification_preferences
      WHERE user_id = $1
    `;

    const result = await this.pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      userId: row.user_id,
      emailWelcome: row.email_welcome,
      emailBookingConfirmation: row.email_booking_confirmation,
      emailBookingCancellation: row.email_booking_cancellation,
      emailEventReminder: row.email_event_reminder,
      emailEventCompleted: row.email_event_completed,
      emailHostReview: row.email_host_review,
      emailPlayerReview: row.email_player_review,
      emailEventUpdates: row.email_event_updates,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async createOrUpdatePreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const query = `
      INSERT INTO users.notification_preferences (
        user_id,
        email_welcome,
        email_booking_confirmation,
        email_booking_cancellation,
        email_event_reminder,
        email_event_completed,
        email_host_review,
        email_player_review,
        email_event_updates,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        email_welcome = COALESCE($2, email_welcome),
        email_booking_confirmation = COALESCE($3, email_booking_confirmation),
        email_booking_cancellation = COALESCE($4, email_booking_cancellation),
        email_event_reminder = COALESCE($5, email_event_reminder),
        email_event_completed = COALESCE($6, email_event_completed),
        email_host_review = COALESCE($7, email_host_review),
        email_player_review = COALESCE($8, email_player_review),
        email_event_updates = COALESCE($9, email_event_updates),
        updated_at = NOW()
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      userId,
      preferences.emailWelcome ?? true,
      preferences.emailBookingConfirmation ?? true,
      preferences.emailBookingCancellation ?? true,
      preferences.emailEventReminder ?? true,
      preferences.emailEventCompleted ?? true,
      preferences.emailHostReview ?? true,
      preferences.emailPlayerReview ?? true,
      preferences.emailEventUpdates ?? true,
    ] as any);

    const row = result.rows[0];
    return {
      userId: row.user_id,
      emailWelcome: row.email_welcome,
      emailBookingConfirmation: row.email_booking_confirmation,
      emailBookingCancellation: row.email_booking_cancellation,
      emailEventReminder: row.email_event_reminder,
      emailEventCompleted: row.email_event_completed,
      emailHostReview: row.email_host_review,
      emailPlayerReview: row.email_player_review,
      emailEventUpdates: row.email_event_updates,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async logEmailSent(
    userId: string,
    recipientEmail: string,
    type: string,
    subject: string,
    status: 'sent' | 'failed' | 'bounced',
    errorMessage?: string,
  ): Promise<EmailAuditLog> {
    const id = uuidv4();
    const query = `
      INSERT INTO users.email_audit_log (
        id,
        user_id,
        recipient_email,
        type,
        subject,
        status,
        error_message,
        sent_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      id,
      userId,
      recipientEmail,
      type,
      subject,
      status,
      errorMessage || null,
    ] as any);

    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      recipientEmail: row.recipient_email,
      type: row.type,
      subject: row.subject,
      status: row.status,
      errorMessage: row.error_message,
      sentAt: row.sent_at,
      openedAt: row.opened_at,
      clickedAt: row.clicked_at,
    };
  }

  async getEmailHistory(userId: string, limit: number = 20, offset: number = 0): Promise<EmailAuditLog[]> {
    const query = `
      SELECT
        id,
        user_id,
        recipient_email,
        type,
        subject,
        status,
        error_message,
        sent_at,
        opened_at,
        clicked_at
      FROM users.email_audit_log
      WHERE user_id = $1
      ORDER BY sent_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await this.pool.query(query, [userId, limit, offset] as any);

    return result.rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      recipientEmail: row.recipient_email,
      type: row.type,
      subject: row.subject,
      status: row.status,
      errorMessage: row.error_message,
      sentAt: row.sent_at,
      openedAt: row.opened_at,
      clickedAt: row.clicked_at,
    }));
  }

  async markEmailAsOpened(emailId: string): Promise<void> {
    const query = `
      UPDATE users.email_audit_log
      SET opened_at = NOW()
      WHERE id = $1
    `;

    await this.pool.query(query, [emailId]);
  }
}
