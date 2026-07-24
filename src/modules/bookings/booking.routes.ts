import { Router } from 'express';
import { body } from 'express-validator';
import BookingService from './booking.service';
import { authMiddleware, AuthRequest } from '../../middleware/auth';
import { handleValidationErrors } from '../../middleware/validation';

const router = Router();

// POST /api/v1/bookings - Create booking
router.post(
  '/bookings',
  authMiddleware,
  [
    body('event_id').notEmpty().trim().withMessage('Event ID is required'),
  ] as any,
  handleValidationErrors,
  async (req: AuthRequest, res: any, next: any) => {
    try {
      const booking = await BookingService.createBooking(req.userId!, {
        event_id: req.body.event_id,
      });

      res.status(201).json({
        success: true,
        data: booking,
      });
    } catch (error) {
      next(error);
    }
  },
);

// GET /api/v1/bookings - Get user bookings
router.get(
  '/bookings',
  authMiddleware,
  async (req: AuthRequest, res: any, next: any) => {
    try {
      const bookings = await BookingService.getUserBookings(req.userId!);

      res.status(200).json({
        success: true,
        data: bookings,
      });
    } catch (error) {
      next(error);
    }
  },
);

// GET /api/v1/bookings/:id - Get booking details
router.get(
  '/bookings/:id',
  authMiddleware,
  async (req: AuthRequest, res: any, next: any) => {
    try {
      const booking = await BookingService.getBookingById(req.params.id);

      res.status(200).json({
        success: true,
        data: booking,
      });
    } catch (error) {
      next(error);
    }
  },
);

// POST /api/v1/bookings/:id/confirm - Confirm booking
router.post(
  '/bookings/:id/confirm',
  authMiddleware,
  async (req: AuthRequest, res: any, next: any) => {
    try {
      const booking = await BookingService.confirmBooking(req.params.id);

      res.status(200).json({
        success: true,
        data: booking,
      });
    } catch (error) {
      next(error);
    }
  },
);

// POST /api/v1/bookings/:id/cancel - Cancel booking
router.post(
  '/bookings/:id/cancel',
  authMiddleware,
  [
    body('reason').notEmpty().trim().withMessage('Cancellation reason is required'),
  ] as any,
  handleValidationErrors,
  async (req: AuthRequest, res: any, next: any) => {
    try {
      const booking = await BookingService.cancelBooking(req.params.id, {
        reason: req.body.reason,
      });

      res.status(200).json({
        success: true,
        data: booking,
      });
    } catch (error) {
      next(error);
    }
  },
);

// POST /api/v1/bookings/:id/pay - Process payment
router.post(
  '/bookings/:id/pay',
  authMiddleware,
  [
    body('payment_method')
      .notEmpty()
      .isIn(['credit_card', 'debit_card', 'paypal', 'stripe'])
      .withMessage('Invalid payment method'),
  ] as any,
  handleValidationErrors,
  async (req: AuthRequest, res: any, next: any) => {
    try {
      const payment = await BookingService.processPayment(
        req.params.id,
        req.body.payment_method,
      );

      res.status(200).json({
        success: true,
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  },
);

// POST /api/v1/bookings/:id/refund - Request refund
router.post(
  '/bookings/:id/refund',
  authMiddleware,
  [
    body('reason').notEmpty().trim().withMessage('Refund reason is required'),
  ] as any,
  handleValidationErrors,
  async (req: AuthRequest, res: any, next: any) => {
    try {
      const refund = await BookingService.requestRefund(req.params.id, {
        reason: req.body.reason,
      });

      res.status(201).json({
        success: true,
        data: refund,
      });
    } catch (error) {
      next(error);
    }
  },
);

// GET /api/v1/bookings/user/refunds - Get user refunds
router.get(
  '/bookings/user/refunds',
  authMiddleware,
  async (req: AuthRequest, res: any, next: any) => {
    try {
      const refunds = await BookingService.getRefunds(req.userId!);

      res.status(200).json({
        success: true,
        data: refunds,
      });
    } catch (error) {
      next(error);
    }
  },
);

// POST /api/v1/bookings/:id/refund/approve - Approve refund (admin only)
router.post(
  '/bookings/refund/:id/approve',
  authMiddleware,
  async (req: AuthRequest, res: any, next: any) => {
    try {
      const refund = await BookingService.approveRefund(req.params.id);

      res.status(200).json({
        success: true,
        data: refund,
      });
    } catch (error) {
      next(error);
    }
  },
);

// POST /api/v1/bookings/:id/refund/complete - Complete refund (admin only)
router.post(
  '/bookings/refund/:id/complete',
  authMiddleware,
  async (req: AuthRequest, res: any, next: any) => {
    try {
      const refund = await BookingService.completeRefund(req.params.id);

      res.status(200).json({
        success: true,
        data: refund,
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
