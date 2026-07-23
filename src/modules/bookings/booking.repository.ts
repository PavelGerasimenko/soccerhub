import { query } from '../../config/database';
import { Booking, Payment, Refund, HostEarnings } from '../../types/booking.interface';
import { generateId } from '../../utils/id';

export class BookingRepository {
  async createBooking(
    userId: string,
    eventId: string,
    amount: number,
    hostCommission: number,
  ): Promise<Booking> {
    const id = generateId();
    const now = new Date();

    const result = await query(
      `INSERT INTO bookings.bookings (
        id, user_id, event_id, amount, host_commission, booking_date, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, user_id, event_id, status, amount, payment_id, host_commission,
        booking_date, confirmation_date, cancellation_date, cancellation_reason,
        refund_amount, refunded_at, created_at, updated_at`,
      [id, userId, eventId, amount, hostCommission, now, now, now],
    );

    return result.rows[0] as Booking;
  }

  async getBookingById(id: string): Promise<Booking | null> {
    const result = await query(
      `SELECT id, user_id, event_id, status, amount, payment_id, host_commission,
        booking_date, confirmation_date, cancellation_date, cancellation_reason,
        refund_amount, refunded_at, created_at, updated_at
      FROM bookings.bookings WHERE id = $1`,
      [id],
    );

    return result.rows[0] || null;
  }

  async getUserBookings(userId: string): Promise<Booking[]> {
    const result = await query(
      `SELECT id, user_id, event_id, status, amount, payment_id, host_commission,
        booking_date, confirmation_date, cancellation_date, cancellation_reason,
        refund_amount, refunded_at, created_at, updated_at
      FROM bookings.bookings WHERE user_id = $1 ORDER BY booking_date DESC`,
      [userId],
    );

    return result.rows as Booking[];
  }

  async getEventBookings(eventId: string): Promise<Booking[]> {
    const result = await query(
      `SELECT id, user_id, event_id, status, amount, payment_id, host_commission,
        booking_date, confirmation_date, cancellation_date, cancellation_reason,
        refund_amount, refunded_at, created_at, updated_at
      FROM bookings.bookings WHERE event_id = $1 ORDER BY booking_date DESC`,
      [eventId],
    );

    return result.rows as Booking[];
  }

  async updateBookingStatus(id: string, status: string): Promise<Booking> {
    const now = new Date();
    const result = await query(
      `UPDATE bookings.bookings SET status = $1, updated_at = $2
      WHERE id = $3
      RETURNING id, user_id, event_id, status, amount, payment_id, host_commission,
        booking_date, confirmation_date, cancellation_date, cancellation_reason,
        refund_amount, refunded_at, created_at, updated_at`,
      [status, now, id],
    );

    return result.rows[0] as Booking;
  }

  async cancelBooking(id: string, reason: string, refundAmount: number): Promise<Booking> {
    const now = new Date();
    const result = await query(
      `UPDATE bookings.bookings SET
        status = 'cancelled', cancellation_date = $1, cancellation_reason = $2,
        refund_amount = $3, updated_at = $1
      WHERE id = $4
      RETURNING id, user_id, event_id, status, amount, payment_id, host_commission,
        booking_date, confirmation_date, cancellation_date, cancellation_reason,
        refund_amount, refunded_at, created_at, updated_at`,
      [now, reason, refundAmount, id],
    );

    return result.rows[0] as Booking;
  }

  async createPayment(
    bookingId: string,
    userId: string,
    eventId: string,
    hostId: string,
    amount: number,
    hostCommission: number,
  ): Promise<Payment> {
    const id = generateId();
    const now = new Date();
    const platformFee = amount * 0.05; // 5% platform fee
    const hostPayout = amount - hostCommission - platformFee;

    const result = await query(
      `INSERT INTO bookings.payments (
        id, booking_id, user_id, event_id, host_id, amount, status,
        host_commission, platform_fee, host_payout, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, booking_id, user_id, event_id, host_id, amount, currency, status,
        payment_method, transaction_id, payment_gateway, host_commission, platform_fee,
        host_payout, payment_date, completed_at, failed_reason, created_at, updated_at`,
      [id, bookingId, userId, eventId, hostId, amount, 'pending', hostCommission, platformFee, hostPayout, now, now],
    );

    return result.rows[0] as Payment;
  }

  async getPaymentByBookingId(bookingId: string): Promise<Payment | null> {
    const result = await query(
      `SELECT id, booking_id, user_id, event_id, host_id, amount, currency, status,
        payment_method, transaction_id, payment_gateway, host_commission, platform_fee,
        host_payout, payment_date, completed_at, failed_reason, created_at, updated_at
      FROM bookings.payments WHERE booking_id = $1`,
      [bookingId],
    );

    return result.rows[0] || null;
  }

  async updatePaymentStatus(paymentId: string, status: string, transactionId?: string): Promise<Payment> {
    const now = new Date();
    const result = await query(
      `UPDATE bookings.payments SET
        status = $1, transaction_id = COALESCE($2, transaction_id),
        ${status === 'completed' ? 'completed_at = $3,' : 'failed_reason = $3,'} updated_at = $3
      WHERE id = $4
      RETURNING id, booking_id, user_id, event_id, host_id, amount, currency, status,
        payment_method, transaction_id, payment_gateway, host_commission, platform_fee,
        host_payout, payment_date, completed_at, failed_reason, created_at, updated_at`,
      [status, transactionId || null, now, paymentId],
    );

    return result.rows[0] as Payment;
  }

  async createRefund(
    bookingId: string,
    paymentId: string,
    userId: string,
    amount: number,
    reason: string,
  ): Promise<Refund> {
    const id = generateId();
    const now = new Date();

    const result = await query(
      `INSERT INTO bookings.refunds (
        id, booking_id, payment_id, user_id, amount, reason, status, requested_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, booking_id, payment_id, user_id, amount, reason, status,
        requested_at, approved_at, completed_at, created_at, updated_at`,
      [id, bookingId, paymentId, userId, amount, reason, 'pending', now, now, now],
    );

    return result.rows[0] as Refund;
  }

  async getRefundsByUserId(userId: string): Promise<Refund[]> {
    const result = await query(
      `SELECT id, booking_id, payment_id, user_id, amount, reason, status,
        requested_at, approved_at, completed_at, created_at, updated_at
      FROM bookings.refunds WHERE user_id = $1 ORDER BY requested_at DESC`,
      [userId],
    );

    return result.rows as Refund[];
  }

  async updateRefundStatus(refundId: string, status: string): Promise<Refund> {
    const now = new Date();
    const result = await query(
      `UPDATE bookings.refunds SET
        status = $1, ${status === 'approved' ? 'approved_at = $2,' : status === 'completed' ? 'completed_at = $2,' : ''} updated_at = $2
      WHERE id = $3
      RETURNING id, booking_id, payment_id, user_id, amount, reason, status,
        requested_at, approved_at, completed_at, created_at, updated_at`,
      [status, now, refundId],
    );

    return result.rows[0] as Refund;
  }

  async getUserBookingForEvent(userId: string, eventId: string): Promise<Booking | null> {
    const result = await query(
      `SELECT id, user_id, event_id, status, amount, payment_id, host_commission,
        booking_date, confirmation_date, cancellation_date, cancellation_reason,
        refund_amount, refunded_at, created_at, updated_at
      FROM bookings.bookings WHERE user_id = $1 AND event_id = $2`,
      [userId, eventId],
    );

    return result.rows[0] || null;
  }

  async getHostEarningsForEvent(hostId: string, eventId: string): Promise<HostEarnings | null> {
    const result = await query(
      `SELECT id, host_id, event_id, total_bookings, total_amount, commission_rate,
        total_commission, platform_fee, net_earnings, paid_out, pending_payout,
        last_payout_date, created_at, updated_at
      FROM bookings.host_earnings WHERE host_id = $1 AND event_id = $2`,
      [hostId, eventId],
    );

    return result.rows[0] || null;
  }
}

export default new BookingRepository();
