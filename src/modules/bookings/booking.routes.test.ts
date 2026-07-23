import request from 'supertest';
import app from '../../app';
import BookingService from './booking.service';
import * as jwtUtils from '../../utils/jwt';
import { NotFoundError, ConflictError } from '../../utils/errors';

jest.mock('./booking.service');
jest.mock('../../utils/jwt');

describe('Booking Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/bookings', () => {
    it('should create booking when authenticated', async () => {
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

      (jwtUtils.verifyAccessToken as jest.Mock).mockReturnValue({
        id: 'user-123',
        email: 'test@example.com',
      });
      (BookingService.createBooking as jest.Mock).mockResolvedValue(mockBooking);

      const response = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', 'Bearer valid-token')
        .send({ event_id: 'event-123' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('booking-123');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/bookings')
        .send({ event_id: 'event-123' });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 409 if event is full', async () => {
      (jwtUtils.verifyAccessToken as jest.Mock).mockReturnValue({
        id: 'user-123',
        email: 'test@example.com',
      });
      (BookingService.createBooking as jest.Mock).mockRejectedValue(
        new ConflictError('Event is full'),
      );

      const response = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', 'Bearer valid-token')
        .send({ event_id: 'event-123' });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('CONFLICT');
    });
  });

  describe('GET /api/v1/bookings', () => {
    it('should get user bookings', async () => {
      const mockBookings = [
        {
          id: 'booking-1',
          user_id: 'user-123',
          event_id: 'event-1',
          status: 'confirmed',
          amount: 10,
          booking_date: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      (jwtUtils.verifyAccessToken as jest.Mock).mockReturnValue({
        id: 'user-123',
        email: 'test@example.com',
      });
      (BookingService.getUserBookings as jest.Mock).mockResolvedValue(mockBookings);

      const response = await request(app)
        .get('/api/v1/bookings')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('POST /api/v1/bookings/:id/pay', () => {
    it('should process payment', async () => {
      const mockPayment = {
        id: 'payment-123',
        booking_id: 'booking-123',
        user_id: 'user-123',
        event_id: 'event-123',
        host_id: 'user-456',
        amount: 10,
        status: 'completed',
        host_commission: 1.5,
        platform_fee: 0.5,
        host_payout: 8,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (jwtUtils.verifyAccessToken as jest.Mock).mockReturnValue({
        id: 'user-123',
        email: 'test@example.com',
      });
      (BookingService.processPayment as jest.Mock).mockResolvedValue(mockPayment);

      const response = await request(app)
        .post('/api/v1/bookings/booking-123/pay')
        .set('Authorization', 'Bearer valid-token')
        .send({ payment_method: 'credit_card' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('completed');
    });

    it('should validate payment method', async () => {
      (jwtUtils.verifyAccessToken as jest.Mock).mockReturnValue({
        id: 'user-123',
        email: 'test@example.com',
      });

      const response = await request(app)
        .post('/api/v1/bookings/booking-123/pay')
        .set('Authorization', 'Bearer valid-token')
        .send({ payment_method: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/bookings/:id/cancel', () => {
    it('should cancel booking', async () => {
      const mockBooking = {
        id: 'booking-123',
        user_id: 'user-123',
        event_id: 'event-123',
        status: 'cancelled',
        amount: 10,
        cancellation_reason: 'Changed plans',
        refund_amount: 8,
        booking_date: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      };

      (jwtUtils.verifyAccessToken as jest.Mock).mockReturnValue({
        id: 'user-123',
        email: 'test@example.com',
      });
      (BookingService.cancelBooking as jest.Mock).mockResolvedValue(mockBooking);

      const response = await request(app)
        .post('/api/v1/bookings/booking-123/cancel')
        .set('Authorization', 'Bearer valid-token')
        .send({ reason: 'Changed plans' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('cancelled');
    });
  });

  describe('POST /api/v1/bookings/:id/refund', () => {
    it('should request refund', async () => {
      const mockRefund = {
        id: 'refund-123',
        booking_id: 'booking-123',
        payment_id: 'payment-123',
        user_id: 'user-123',
        amount: 8,
        reason: 'Not available',
        status: 'pending',
        requested_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      };

      (jwtUtils.verifyAccessToken as jest.Mock).mockReturnValue({
        id: 'user-123',
        email: 'test@example.com',
      });
      (BookingService.requestRefund as jest.Mock).mockResolvedValue(mockRefund);

      const response = await request(app)
        .post('/api/v1/bookings/booking-123/refund')
        .set('Authorization', 'Bearer valid-token')
        .send({ reason: 'Not available' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('pending');
    });
  });
});
