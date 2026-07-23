import NotificationRepository from './notification.repository';
import EmailService from '../../services/email.service';
import { NotificationPreferences, EmailPayload, NotificationType } from '../../types/notification.interface';
import { ValidationError } from '../../utils/errors';

export default class NotificationService {
  private repository: NotificationRepository;
  private emailService: EmailService;

  constructor(repository?: NotificationRepository, emailService?: EmailService) {
    this.repository = repository || new NotificationRepository();
    this.emailService = emailService || new EmailService();
  }

  async getPreferences(userId: string): Promise<NotificationPreferences> {
    if (!userId || typeof userId !== 'string') {
      throw new ValidationError('User ID is required');
    }

    let preferences = await this.repository.getPreferences(userId);

    if (!preferences) {
      preferences = await this.repository.createOrUpdatePreferences(userId, {
        emailWelcome: true,
        emailBookingConfirmation: true,
        emailBookingCancellation: true,
        emailEventReminder: true,
        emailEventCompleted: true,
        emailHostReview: true,
        emailPlayerReview: true,
        emailEventUpdates: true,
      });
    }

    return preferences;
  }

  async updatePreferences(
    userId: string,
    updates: Partial<NotificationPreferences>,
  ): Promise<NotificationPreferences> {
    if (!userId || typeof userId !== 'string') {
      throw new ValidationError('User ID is required');
    }

    return this.repository.createOrUpdatePreferences(userId, updates);
  }

  async sendEmail(payload: EmailPayload, userEmail: string): Promise<boolean> {
    try {
      if (!payload.type || !payload.data || !userEmail) {
        throw new ValidationError('Missing required email fields');
      }

      const template = this.emailService.getTemplate(payload.type);
      if (!template) {
        throw new ValidationError(`Unknown email template: ${payload.type}`);
      }

      const rendered = this.emailService.renderTemplate(template, {
        recipientName: payload.recipientName || 'User',
        appUrl: process.env.APP_URL || 'https://soccerhub.com',
        eventDetailsUrl: process.env.APP_URL ? `${process.env.APP_URL}/events/${payload.data.eventId}` : '',
        browseEventsUrl: process.env.APP_URL ? `${process.env.APP_URL}/events` : '',
        dashboardUrl: process.env.APP_URL ? `${process.env.APP_URL}/dashboard` : '',
        reviewUrl: process.env.APP_URL ? `${process.env.APP_URL}/reviews` : '',
        ...payload.data,
      });

      // Log email attempt
      try {
        await this.repository.logEmailSent(
          payload.userId || 'system',
          userEmail,
          payload.type,
          rendered.subject,
          'sent',
        );
      } catch (logError) {
        console.error('Failed to log email:', logError);
      }

      // TODO: Integrate with real email provider (SendGrid, AWS SES, etc.)
      // For now, we simulate successful send
      console.log(`[EMAIL] To: ${userEmail}, Type: ${payload.type}, Subject: ${rendered.subject}`);

      return true;
    } catch (error) {
      console.error('Failed to send email:', error);

      if (payload.userId) {
        try {
          await this.repository.logEmailSent(
            payload.userId,
            userEmail,
            payload.type,
            `Error sending ${payload.type}`,
            'failed',
            error instanceof Error ? error.message : 'Unknown error',
          );
        } catch (logError) {
          console.error('Failed to log email error:', logError);
        }
      }

      return false;
    }
  }

  async shouldSendEmail(userId: string, type: NotificationType): Promise<boolean> {
    try {
      const preferences = await this.getPreferences(userId);

      const preferencesMap: Record<NotificationType, keyof NotificationPreferences> = {
        [NotificationType.WELCOME]: 'emailWelcome',
        [NotificationType.BOOKING_CONFIRMATION]: 'emailBookingConfirmation',
        [NotificationType.BOOKING_CANCELLED]: 'emailBookingCancellation',
        [NotificationType.EVENT_REMINDER]: 'emailEventReminder',
        [NotificationType.EVENT_COMPLETED]: 'emailEventCompleted',
        [NotificationType.HOST_REVIEW]: 'emailHostReview',
        [NotificationType.PLAYER_REVIEW]: 'emailPlayerReview',
        [NotificationType.EVENT_UPDATED]: 'emailEventUpdates',
      };

      const prefKey = preferencesMap[type];
      return (preferences as any)[prefKey] ?? true;
    } catch (error) {
      console.error('Error checking email preferences:', error);
      return true;
    }
  }

  async getEmailHistory(userId: string, limit: number = 20, offset: number = 0) {
    if (!userId || typeof userId !== 'string') {
      throw new ValidationError('User ID is required');
    }

    if (limit < 1 || limit > 100) {
      throw new ValidationError('Limit must be between 1 and 100');
    }

    if (offset < 0) {
      throw new ValidationError('Offset must be non-negative');
    }

    const history = await this.repository.getEmailHistory(userId, limit, offset);

    return {
      emails: history,
      total: history.length,
    };
  }
}
