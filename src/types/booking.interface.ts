export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
export type RefundStatus = 'pending' | 'approved' | 'processing' | 'completed' | 'rejected';

export interface Booking {
  id: string;
  user_id: string;
  event_id: string;
  status: BookingStatus;
  amount: number;
  payment_id?: string;
  host_commission: number;
  booking_date: Date;
  confirmation_date?: Date;
  cancellation_date?: Date;
  cancellation_reason?: string;
  refund_amount?: number;
  refunded_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Payment {
  id: string;
  booking_id: string;
  user_id: string;
  event_id: string;
  host_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method?: string;
  transaction_id?: string;
  payment_gateway?: string;
  host_commission: number;
  platform_fee: number;
  host_payout?: number;
  payment_date?: Date;
  completed_at?: Date;
  failed_reason?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Refund {
  id: string;
  booking_id: string;
  payment_id: string;
  user_id: string;
  amount: number;
  reason: string;
  status: RefundStatus;
  requested_at: Date;
  approved_at?: Date;
  completed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CreateBookingRequest {
  event_id: string;
}

export interface CancelBookingRequest {
  reason: string;
}

export interface ApproveRefundRequest {}

export interface ProcessPaymentRequest {
  booking_id: string;
  payment_method: string;
  transaction_id?: string;
}

export interface RequestRefundRequest {
  reason: string;
}

export interface BookingWithDetails extends Booking {
  event?: {
    id: string;
    title: string;
    price: number;
    host_id: string;
  };
  payment?: Payment;
}

export interface HostEarnings {
  id: string;
  host_id: string;
  event_id: string;
  total_bookings: number;
  total_amount: number;
  commission_rate: number;
  total_commission: number;
  platform_fee: number;
  net_earnings: number;
  paid_out: number;
  pending_payout: number;
  last_payout_date?: Date;
  created_at: Date;
  updated_at: Date;
}
