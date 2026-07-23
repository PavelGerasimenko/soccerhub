import { Pool, QueryResult } from 'pg';
import pool from '../../config/database';
import {
  HostDashboardStats,
  HostEarningsData,
  HostEventAnalytics,
  PlayerRatingForHost,
  HostReviewStats,
  HostReview,
} from '../../types/hostDashboard.interface';

export default class HostDashboardRepository {
  private pool: Pool;

  constructor() {
    this.pool = pool;
  }

  async getDashboardStats(userId: string): Promise<HostDashboardStats> {
    const query = `
      SELECT
        (SELECT COUNT(*) FROM events.events WHERE host_id = $1) as total_events,
        COALESCE(SUM(CASE
          WHEN b.status = 'completed' THEN b.amount
          ELSE 0
        END), 0) as total_earnings,
        (SELECT COUNT(*) FROM events.participation WHERE event_id IN
          (SELECT id FROM events.events WHERE host_id = $1)) as total_bookings,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        (SELECT COUNT(*) FROM users.reviews WHERE reviewee_id = $1) as total_reviews,
        (SELECT COUNT(*) FROM events.events WHERE host_id = $1 AND start_time > NOW()) as upcoming_events,
        (SELECT COUNT(*) FROM events.events WHERE host_id = $1 AND start_time <= NOW()) as past_events
      FROM bookings.payments b
      LEFT JOIN users.reviews r ON r.reviewee_id = $1
      WHERE b.event_id IN (SELECT id FROM events.events WHERE host_id = $1)
        AND b.status = 'completed'
    `;

    const result = await this.pool.query(query, [userId]);
    const row = result.rows[0];

    return {
      totalEvents: parseInt(row.total_events, 10) || 0,
      totalEarnings: parseFloat(row.total_earnings) || 0,
      totalBookings: parseInt(row.total_bookings, 10) || 0,
      avgRating: parseFloat(row.avg_rating) || 0,
      totalReviews: parseInt(row.total_reviews, 10) || 0,
      upcomingEvents: parseInt(row.upcoming_events, 10) || 0,
      pastEvents: parseInt(row.past_events, 10) || 0,
    };
  }

  async getHostEarnings(
    userId: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 50,
    offset: number = 0,
  ): Promise<HostEarningsData[]> {
    let query = `
      SELECT
        e.id as event_id,
        e.title as event_title,
        e.start_time as event_date,
        e.price as booking_price,
        COUNT(p.id) as total_bookings,
        COALESCE(SUM(p.amount), 0) as total_revenue,
        COALESCE(SUM(p.amount * 0.15), 0) as host_commission,
        COALESCE(SUM(p.amount * 0.05), 0) as platform_fee,
        COALESCE(SUM(p.amount * 0.80), 0) as net_earnings
      FROM events.events e
      LEFT JOIN bookings.payments p ON p.event_id = e.id AND p.status = 'completed'
      WHERE e.host_id = $1
    `;

    const params: any[] = [userId];
    let paramCount = 1;

    if (startDate) {
      paramCount += 1;
      query += ` AND e.start_time >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount += 1;
      query += ` AND e.start_time <= $${paramCount}`;
      params.push(endDate);
    }

    query += ` GROUP BY e.id, e.title, e.start_time, e.price`;
    query += ` ORDER BY e.start_time DESC`;
    query += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await this.pool.query(query, params);

    return result.rows.map((row: any) => ({
      eventId: row.event_id,
      eventTitle: row.event_title,
      eventDate: row.event_date,
      bookingPrice: parseFloat(row.booking_price),
      totalBookings: parseInt(row.total_bookings, 10),
      totalRevenue: parseFloat(row.total_revenue),
      hostCommission: parseFloat(row.host_commission),
      platformFee: parseFloat(row.platform_fee),
      netEarnings: parseFloat(row.net_earnings),
    }));
  }

  async getHostEventAnalytics(userId: string): Promise<HostEventAnalytics[]> {
    const query = `
      SELECT
        e.id,
        e.title,
        e.start_time,
        e.max_capacity,
        COUNT(p.id) as current_participants,
        ROUND(COUNT(p.id)::numeric / NULLIF(e.max_capacity, 0) * 100, 2) as fill_percentage,
        e.price,
        e.status,
        COALESCE(SUM(bp.amount), 0) as total_revenue,
        COALESCE(SUM(bp.amount * 0.15), 0) as host_earnings
      FROM events.events e
      LEFT JOIN events.participation p ON p.event_id = e.id
      LEFT JOIN bookings.payments bp ON bp.event_id = e.id AND bp.status = 'completed'
      WHERE e.host_id = $1
      GROUP BY e.id, e.title, e.start_time, e.max_capacity, e.price, e.status
      ORDER BY e.start_time DESC
    `;

    const result = await this.pool.query(query, [userId]);

    return result.rows.map((row: any) => ({
      eventId: row.id,
      title: row.title,
      startTime: row.start_time,
      maxCapacity: parseInt(row.max_capacity, 10),
      currentParticipants: parseInt(row.current_participants, 10),
      fillPercentage: parseFloat(row.fill_percentage) || 0,
      price: parseFloat(row.price),
      status: row.status,
      totalRevenue: parseFloat(row.total_revenue),
      hostEarnings: parseFloat(row.host_earnings),
    }));
  }

  async getPlayerRatingsForHost(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<PlayerRatingForHost[]> {
    const query = `
      SELECT
        u.id as player_id,
        u.first_name || ' ' || u.last_name as player_name,
        u.email as player_email,
        u.profile_picture,
        COALESCE(AVG(r.rating), 0) as avg_rating_given,
        COUNT(r.id) as total_reviews,
        MAX(r.created_at) as last_review_date
      FROM users.users u
      LEFT JOIN users.reviews r ON r.reviewer_id = u.id AND r.reviewee_id = $1
      WHERE u.id IN (
        SELECT DISTINCT p.user_id
        FROM events.participation p
        WHERE p.event_id IN (SELECT id FROM events.events WHERE host_id = $1)
      )
      GROUP BY u.id, u.first_name, u.last_name, u.email, u.profile_picture
      ORDER BY last_review_date DESC NULLS LAST
      LIMIT $2 OFFSET $3
    `;

    const result = await this.pool.query(query, [userId, limit, offset] as any);

    return result.rows.map((row: any) => ({
      playerId: row.player_id,
      playerName: row.player_name,
      playerEmail: row.player_email,
      profilePicture: row.profile_picture,
      avgRatingGiven: parseFloat(row.avg_rating_given),
      totalReviews: parseInt(row.total_reviews, 10),
      lastReviewDate: row.last_review_date,
    }));
  }

  async getHostReviewStats(userId: string): Promise<HostReviewStats> {
    const statsQuery = `
      SELECT
        COUNT(*) as total_reviews,
        COALESCE(AVG(rating), 0) as avg_rating,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
      FROM users.reviews
      WHERE reviewee_id = $1
    `;

    const statsResult = await this.pool.query(statsQuery, [userId]);
    const statsRow = statsResult.rows[0];

    const recentReviewsQuery = `
      SELECT
        r.id,
        r.reviewer_id,
        u.first_name || ' ' || u.last_name as reviewer_name,
        r.rating,
        r.comment,
        r.created_at
      FROM users.reviews r
      JOIN users.users u ON u.id = r.reviewer_id
      WHERE r.reviewee_id = $1
      ORDER BY r.created_at DESC
      LIMIT 10
    `;

    const recentResult = await this.pool.query(recentReviewsQuery, [userId]);

    return {
      totalReviews: parseInt(statsRow.total_reviews, 10),
      avgRating: parseFloat(statsRow.avg_rating),
      ratingDistribution: {
        fiveStar: parseInt(statsRow.five_star, 10) || 0,
        fourStar: parseInt(statsRow.four_star, 10) || 0,
        threeStar: parseInt(statsRow.three_star, 10) || 0,
        twoStar: parseInt(statsRow.two_star, 10) || 0,
        oneStar: parseInt(statsRow.one_star, 10) || 0,
      },
      recentReviews: recentResult.rows.map((row: any) => ({
        id: row.id,
        reviewerId: row.reviewer_id,
        reviewerName: row.reviewer_name,
        rating: parseInt(row.rating, 10),
        comment: row.comment,
        createdAt: row.created_at,
      })),
    };
  }
}
