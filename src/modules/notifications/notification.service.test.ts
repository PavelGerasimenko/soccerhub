import NotificationService from './notification.service';
import NotificationRepository from './notification.repository';
import EmailService from '../../services/email.service';
import { ValidationError } from '../../utils/errors';
import { NotificationType } from '../../types/notification.interface';

describe('NotificationService', () => {
  let service: NotificationService;
  let repository: jest.Mocked<NotificationRepository>;
  let emailService: jest.Mocked<EmailService>;

  const mockUserId = '550e8400-e29b-41d4-a716-446655440000';

  const mockPreferences = {
    userId: mockUserId,
    emailWelcome: true,
    emailBookingConfirmation: true,
    emailBookingCancellation: true,
    emailEventReminder: true,
    emailEventCompleted: true,
    emailHostReview: true,
    emailPlayerReview: true,
    emailEventUpdates: true,
    createdAt: new Date('2026-07-01'),
    updatedAt: new Date('2026-07-01'),
  };

  beforeEach(() => {
    repository = {
      getPreferences: jest.fn(),
      createOrUpdatePreferences: jest.fn(),
      logEmailSent: jest.fn(),
      getEmailHistory: jest.fn(),
      markEmailAsOpened: jest.fn(),
    } as any;

    emailService = {
      getTemplate: jest.fn(),
      renderTemplate: jest.fn(),
      getAllTemplates: jest.fn(),
    } as any;

    service = new NotificationService(repository, emailService);
  });

  describe('getPreferences', () => {
    it('should return preferences for valid user', async () => {
      repository.getPreferences.mockResolvedValue(mockPreferences);

      const result = await service.getPreferences(mockUserId);

      expect(result).toEqual(mockPreferences);
      expect(repository.getPreferences).toHaveBeenCalledWith(mockUserId);
    });

    it('should create default preferences if not exists', async () => {
      repository.getPreferences.mockResolvedValue(null);
      repository.createOrUpdatePreferences.mockResolvedValue(mockPreferences);

      const result = await service.getPreferences(mockUserId);

      expect(result).toEqual(mockPreferences);
      expect(repository.createOrUpdatePreferences).toHaveBeenCalled();
    });

    it('should throw error for invalid user ID', async () => {
      await expect(service.getPreferences('')).rejects.toThrow(ValidationError);
    });
  });

  describe('updatePreferences', () => {
    it('should update user preferences', async () => {
      const updates = { emailWelcome: false, emailEventReminder: false };
      const updated = { ...mockPreferences, ...updates };
      repository.createOrUpdatePreferences.mockResolvedValue(updated);

      const result = await service.updatePreferences(mockUserId, updates);

      expect(result.emailWelcome).toBe(false);
      expect(result.emailEventReminder).toBe(false);
      expect(repository.createOrUpdatePreferences).toHaveBeenCalledWith(mockUserId, updates);
    });

    it('should throw error for invalid user ID', async () => {
      await expect(service.updatePreferences('', {})).rejects.toThrow(ValidationError);
    });
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      const template = {
        type: NotificationType.WELCOME,
        subject: 'Welcome to SoccerHub!',
        htmlContent: '<h1>Welcome {{recipientName}}</h1>',
        textContent: 'Welcome {{recipientName}}',
      };

      const rendered = {
        subject: 'Welcome to SoccerHub!',
        html: '<h1>Welcome John</h1>',
        text: 'Welcome John',
      };

      emailService.getTemplate.mockReturnValue(template);
      emailService.renderTemplate.mockReturnValue(rendered);
      repository.logEmailSent.mockResolvedValue({
        id: 'log-1',
        userId: mockUserId,
        recipientEmail: 'john@example.com',
        type: NotificationType.WELCOME,
        subject: rendered.subject,
        status: 'sent',
        sentAt: new Date(),
      });

      const result = await service.sendEmail(
        {
          to: 'john@example.com',
          recipientName: 'John',
          type: NotificationType.WELCOME,
          data: {},
          userId: mockUserId,
        },
        'john@example.com',
      );

      expect(result).toBe(true);
      expect(emailService.getTemplate).toHaveBeenCalledWith(NotificationType.WELCOME);
    });

    it('should throw error for missing email fields', async () => {
      const result = await service.sendEmail(
        {
          to: '',
          recipientName: '',
          type: NotificationType.WELCOME,
          data: {},
          userId: mockUserId,
        },
        '',
      );

      expect(result).toBe(false);
    });

    it('should handle unknown template', async () => {
      emailService.getTemplate.mockReturnValue(undefined);

      const result = await service.sendEmail(
        {
          to: 'john@example.com',
          recipientName: 'John',
          type: NotificationType.WELCOME,
          data: {},
          userId: mockUserId,
        },
        'john@example.com',
      );

      expect(result).toBe(false);
    });
  });

  describe('shouldSendEmail', () => {
    it('should return true if user prefers to receive email', async () => {
      repository.getPreferences.mockResolvedValue(mockPreferences);

      const result = await service.shouldSendEmail(mockUserId, NotificationType.WELCOME);

      expect(result).toBe(true);
    });

    it('should return false if user disabled notifications', async () => {
      const prefs = { ...mockPreferences, emailWelcome: false };
      repository.getPreferences.mockResolvedValue(prefs);

      const result = await service.shouldSendEmail(mockUserId, NotificationType.WELCOME);

      expect(result).toBe(false);
    });

    it('should return true on error (safe default)', async () => {
      repository.getPreferences.mockRejectedValue(new Error('DB error'));

      const result = await service.shouldSendEmail(mockUserId, NotificationType.WELCOME);

      expect(result).toBe(true);
    });
  });

  describe('getEmailHistory', () => {
    it('should return email history with pagination', async () => {
      const mockHistory = [
        {
          id: 'email-1',
          userId: mockUserId,
          recipientEmail: 'john@example.com',
          type: NotificationType.WELCOME,
          subject: 'Welcome',
          status: 'sent' as const,
          sentAt: new Date(),
        },
      ];

      repository.getEmailHistory.mockResolvedValue(mockHistory);

      const result = await service.getEmailHistory(mockUserId, 20, 0);

      expect(result.emails).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should validate limit parameter', async () => {
      await expect(service.getEmailHistory(mockUserId, 101, 0)).rejects.toThrow(ValidationError);
      await expect(service.getEmailHistory(mockUserId, 0, 0)).rejects.toThrow(ValidationError);
    });

    it('should validate offset parameter', async () => {
      await expect(service.getEmailHistory(mockUserId, 20, -1)).rejects.toThrow(ValidationError);
    });

    it('should throw error for invalid user ID', async () => {
      await expect(service.getEmailHistory('', 20, 0)).rejects.toThrow(ValidationError);
    });
  });
});
