import BookingRepository from './booking.repository';
import EventRepository from '../events/event.repository';
import { Booking, Payment, Refund, CreateBookingRequest, CancelBookingRequest, RequestRefundRequest } from '../../types/booking.interface';
import { NotFoundError, ConflictError, ValidationError } from '../../utils/errors';

const COMMISSION_RATE = 0.15; // 15% host commission
const PLATFORM_FEE = 0.05; // 5% platform fee

export class BookingService {
  async createBooking(userId: string, data: CreateBookingRequest): Promise<Booking> {
    // Get event
    const event = await EventRepository.getEventById(data.event_id);
    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Check if user already booked
    const existingBooking = await BookingRepository.getUserBookingForEvent(userId, data.event_id);
    if (existingBooking && existingBooking.status !== 'cancelled') {
      throw new ConflictError('User already booked this event');
    }

    // Check capacity
    if (event.current_participants >= event.max_participants) {
      throw new ConflictError('Event is full');
    }

    // Calculate amounts
    const amount = event.price || 0;
    const hostCommission = amount * COMMISSION_RATE;

    // Create booking
    const booking = await BookingRepository.createBooking(
      userId,
      data.event_id,
      amount,
      hostCommission,
    );

    return booking;
  }

  async getBookingById(id: string): Promise<Booking> {
    const booking = await BookingRepository.getBookingById(id);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }
    return booking;
  }

  async getUserBookings(userId: string): Promise<Booking[]> {
    return BookingRepository.getUserBookings(userId);
  }

  async getEventBookings(eventId: string): Promise<Booking[]> {
    return BookingRepository.getEventBookings(eventId);
  }

  async confirmBooking(bookingId: string): Promise<Booking> {
    const booking = await this.getBookingById(bookingId);

    if (booking.status !== 'pending') {
      throw new ValidationError('Only pending bookings can be confirmed');
    }

    return BookingRepository.updateBookingStatus(bookingId, 'confirmed');
  }

  async cancelBooking(bookingId: string, data: CancelBookingRequest): Promise<Booking> {
    const booking = await this.getBookingById(bookingId);

    if (booking.status === 'cancelled') {
      throw new ValidationError('Booking is already cancelled');
    }

    if (booking.status === 'completed') {
      throw new ValidationError('Cannot cancel completed booking');
    }

    // Calculate refund based on status
    let refundAmount = booking.amount;
    if (booking.status === 'confirmed') {
      refundAmount = booking.amount * 0.8; // 20% cancellation fee
    }

    return BookingRepository.cancelBooking(bookingId, data.reason, refundAmount);
  }

  async processPayment(bookingId: string, paymentMethod: string): Promise<Payment> {
    const booking = await this.getBookingById(bookingId);

    if (booking.status !== 'pending') {
      throw new ValidationError('Only pending bookings can be paid');
    }

    const event = await EventRepository.getEventById(booking.event_id);
    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Check if payment already exists
    let payment = await BookingRepository.getPaymentByBookingId(bookingId);
    if (payment && payment.status === 'completed') {
      throw new ConflictError('Payment already processed');
    }

    if (!payment) {
      payment = await BookingRepository.createPayment(
        bookingId,
        booking.user_id,
        booking.event_id,
        event.host_id,
        booking.amount,
        booking.host_commission,
      );
    }

    // Update payment to completed (in real system, this would call payment gateway)
    const updatedPayment = await BookingRepository.updatePaymentStatus(
      payment.id,
      'completed',
      `TXN-${Date.now()}`,
    );

    // Confirm booking
    await BookingRepository.updateBookingStatus(bookingId, 'confirmed');

    return updatedPayment;
  }

  async requestRefund(bookingId: string, data: RequestRefundRequest): Promise<Refund> {
    const booking = await this.getBookingById(bookingId);

    if (booking.status !== 'confirmed' && booking.status !== 'completed') {
      throw new ValidationError('Can only refund confirmed or completed bookings');
    }

    const payment = await BookingRepository.getPaymentByBookingId(bookingId);
    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    if (payment.status === 'refunded') {
      throw new ConflictError('Payment already refunded');
    }

    // Calculate refund amount
    const refundAmount = booking.refund_amount || booking.amount * 0.8;

    return BookingRepository.createRefund(
      bookingId,
      payment.id,
      booking.user_id,
      refundAmount,
      data.reason,
    );
  }

  async getRefunds(userId: string): Promise<Refund[]> {
    return BookingRepository.getRefundsByUserId(userId);
  }

  async approveRefund(refundId: string): Promise<Refund> {
    return BookingRepository.updateRefundStatus(refundId, 'approved');
  }

  async completeRefund(refundId: string): Promise<Refund> {
    return BookingRepository.updateRefundStatus(refundId, 'completed');
  }
}

export default new BookingService();
