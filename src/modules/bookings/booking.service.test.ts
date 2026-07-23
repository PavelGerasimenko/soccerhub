import BookingService from './booking.service';
import BookingRepository from './booking.repository';
import EventRepository from '../events/event.repository';
import { NotFoundError, ConflictError, ValidationError } from '../../utils/errors';

jest.mock('./booking.repository');
jest.mock('../events/event.repository');

describe('BookingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createBooking', () => {
    it('should create booking successfully', async () => {
      const mockEvent = {
        id: 'event-123',
        title: 'Match',
        type: 'game',
        location: 'Park',
        city: 'NYC',
        start_time: new Date(),
        end_time: new Date(),
        host_id: 'user-456',
        max_participants: 22,
        current_participants: 10,
        price: 10,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockBooking = {
        id: 'booking-123',
        user_id: 'user-123',
        event_id: 'event-123',
        status: 'pending',
        amount: 10,
        host_commission: 1.5,
        booking_date: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      };

      (EventRepository.getEventById as jest.Mock).mockResolvedValue(mockEvent);
      (BookingRepository.getUserBookingForEvent as jest.Mock).mockResolvedValue(null);
      (BookingRepository.createBooking as jest.Mock).mockResolvedValue(mockBooking);

      const result = await BookingService.createBooking('user-123', {
        event_id: 'event-123',
      });

      expect(result).toEqual(mockBooking);
      expect(EventRepository.getEventById).toHaveBeenCalledWith('event-123');
    });

    it('should throw error if event not found', async () => {
      (EventRepository.getEventById as jest.Mock).mockResolvedValue(null);

      await expect(
        BookingService.createBooking('user-123', { event_id: 'nonexistent' }),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw error if user already booked', async () => {
      const mockEvent = {
        id: 'event-123',
        title: 'Match',
        type: 'game',
        location: 'Park',
        city: 'NYC',
        start_time: new Date(),
        end_time: new Date(),
        host_id: 'user-456',
        max_participants: 22,
        current_participants: 10,
        price: 10,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const existingBooking = {
        id: 'booking-123',
        user_id: 'user-123',
        event_id: 'event-123',
        status: 'confirmed',
        amount: 10,
        booking_date: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      };

      (EventRepository.getEventById as jest.Mock).mockResolvedValue(mockEvent);
      (BookingRepository.getUserBookingForEvent as jest.Mock).mockResolvedValue(existingBooking);

      await expect(
        BookingService.createBooking('user-123', { event_id: 'event-123' }),
      ).rejects.toThrow(ConflictError);
    });

    it('should throw error if event is full', async () => {
      const mockEvent = {
        id: 'event-123',
        title: 'Match',
        type: 'game',
        location: 'Park',
        city: 'NYC',
        start_time: new Date(),
        end_time: new Date(),
        host_id: 'user-456',
        max_participants: 22,
        current_participants: 22,
        price: 10,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (EventRepository.getEventById as jest.Mock).mockResolvedValue(mockEvent);
      (BookingRepository.getUserBookingForEvent as jest.Mock).mockResolvedValue(null);

      await expect(
        BookingService.createBooking('user-123', { event_id: 'event-123' }),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('processPayment', () => {
    it('should process payment successfully', async () => {
      const mockBooking = {
        id: 'booking-123',
        user_id: 'user-123',
        event_id: 'event-123',
        status: 'pending',
        amount: 10,
        host_commission: 1.5,
        booking_date: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockEvent = {
        id: 'event-123',
        title: 'Match',
        type: 'game',
        location: 'Park',
        city: 'NYC',
        start_time: new Date(),
        end_time: new Date(),
        host_id: 'user-456',
        max_participants: 22,
        current_participants: 10,
        price: 10,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockPayment = {
        id: 'payment-123',
        booking_id: 'booking-123',
        user_id: 'user-123',
        event_id: 'event-123',
        host_id: 'user-456',
        amount: 10,
        status: 'completed',
        currency: 'USD',
        host_commission: 1.5,
        platform_fee: 0.5,
        host_payout: 8,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (BookingRepository.getBookingById as jest.Mock).mockResolvedValue(mockBooking);
      (EventRepository.getEventById as jest.Mock).mockResolvedValue(mockEvent);
      (BookingRepository.getPaymentByBookingId as jest.Mock).mockResolvedValue(null);
      (BookingRepository.createPayment as jest.Mock).mockResolvedValue(mockPayment);
      (BookingRepository.updatePaymentStatus as jest.Mock).mockResolvedValue(mockPayment);
      (BookingRepository.updateBookingStatus as jest.Mock).mockResolvedValue({
        ...mockBooking,
        status: 'confirmed',
      });

      const result = await BookingService.processPayment('booking-123', 'credit_card');

      expect(result.status).toBe('completed');
    });

    it('should throw error if payment already processed', async () => {
      const mockBooking = {
        id: 'booking-123',
        user_id: 'user-123',
        event_id: 'event-123',
        status: 'pending',
        amount: 10,
        booking_date: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockPayment = {
        id: 'payment-123',
        status: 'completed',
        booking_id: 'booking-123',
        created_at: new Date(),
        updated_at: new Date(),
      };

      (BookingRepository.getBookingById as jest.Mock).mockResolvedValue(mockBooking);
      (BookingRepository.getPaymentByBookingId as jest.Mock).mockResolvedValue(mockPayment);

      await expect(
        BookingService.processPayment('booking-123', 'credit_card'),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('cancelBooking', () => {
    it('should cancel booking successfully', async () => {
      const mockBooking = {
        id: 'booking-123',
        user_id: 'user-123',
        event_id: 'event-123',
        status: 'confirmed',
        amount: 10,
        booking_date: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      };

      const cancelledBooking = {
        ...mockBooking,
        status: 'cancelled',
        cancellation_reason: 'Changed plans',
        refund_amount: 8,
      };

      (BookingRepository.getBookingById as jest.Mock).mockResolvedValue(mockBooking);
      (BookingRepository.cancelBooking as jest.Mock).mockResolvedValue(cancelledBooking);

      const result = await BookingService.cancelBooking('booking-123', {
        reason: 'Changed plans',
      });

      expect(result.status).toBe('cancelled');
    });

    it('should throw error if already cancelled', async () => {
      const mockBooking = {
        id: 'booking-123',
        status: 'cancelled',
        booking_date: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      };

      (BookingRepository.getBookingById as jest.Mock).mockResolvedValue(mockBooking);

      await expect(
        BookingService.cancelBooking('booking-123', { reason: 'Test' }),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('requestRefund', () => {
    it('should request refund successfully', async () => {
      const mockBooking = {
        id: 'booking-123',
        status: 'confirmed',
        amount: 10,
        refund_amount: 8,
        user_id: 'user-123',
        event_id: 'event-123',
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockPayment = {
        id: 'payment-123',
        booking_id: 'booking-123',
        status: 'completed',
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockRefund = {
        id: 'refund-123',
        booking_id: 'booking-123',
        payment_id: 'payment-123',
        user_id: 'user-123',
        amount: 8,
        reason: 'Not available',
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date(),
      };

      (BookingRepository.getBookingById as jest.Mock).mockResolvedValue(mockBooking);
      (BookingRepository.getPaymentByBookingId as jest.Mock).mockResolvedValue(mockPayment);
      (BookingRepository.createRefund as jest.Mock).mockResolvedValue(mockRefund);

      const result = await BookingService.requestRefund('booking-123', {
        reason: 'Not available',
      });

      expect(result.status).toBe('pending');
    });
  });
});
