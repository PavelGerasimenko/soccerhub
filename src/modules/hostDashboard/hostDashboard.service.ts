import HostDashboardRepository from './hostDashboard.repository';
import {
  HostDashboardOverview,
  HostDashboardStats,
  HostEarningsData,
  HostEventAnalytics,
  PlayerRatingForHost,
  HostReviewStats,
} from '../../types/hostDashboard.interface';
import { ValidationError, NotFoundError } from '../../utils/errors';

export default class HostDashboardService {
  private repository: HostDashboardRepository;

  constructor(repository?: HostDashboardRepository) {
    this.repository = repository || new HostDashboardRepository();
  }

  async getDashboardOverview(userId: string): Promise<HostDashboardOverview> {
    if (!userId || typeof userId !== 'string') {
      throw new ValidationError('User ID is required');
    }

    const [stats, earnings, upcomingEvents, pastEvents, reviewStats] = await Promise.all([
      this.repository.getDashboardStats(userId),
      this.repository.getHostEarnings(userId, undefined, undefined, 5, 0),
      this.getUpcomingEvents(userId),
      this.getPastEvents(userId),
      this.repository.getHostReviewStats(userId),
    ]);

    if (stats.totalEvents === 0) {
      throw new NotFoundError('No hosted events found for this user');
    }

    return {
      userId,
      stats,
      earningsData: earnings,
      upcomingEvents,
      pastEvents,
      reviewStats,
    };
  }

  async getEarnings(
    userId: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ earnings: HostEarningsData[]; total: number; totalEarnings: number }> {
    if (!userId || typeof userId !== 'string') {
      throw new ValidationError('User ID is required');
    }

    if (limit < 1 || limit > 100) {
      throw new ValidationError('Limit must be between 1 and 100');
    }

    if (offset < 0) {
      throw new ValidationError('Offset must be non-negative');
    }

    if (startDate && endDate && startDate > endDate) {
      throw new ValidationError('Start date must be before end date');
    }

    const earnings = await this.repository.getHostEarnings(
      userId,
      startDate,
      endDate,
      limit,
      offset,
    );

    const totalEarnings = earnings.reduce((sum, e) => sum + e.netEarnings, 0);

    return {
      earnings,
      total: earnings.length,
      totalEarnings,
    };
  }

  async getEventAnalytics(userId: string): Promise<HostEventAnalytics[]> {
    if (!userId || typeof userId !== 'string') {
      throw new ValidationError('User ID is required');
    }

    return this.repository.getHostEventAnalytics(userId);
  }

  async getPlayerRatings(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ players: PlayerRatingForHost[]; total: number }> {
    if (!userId || typeof userId !== 'string') {
      throw new ValidationError('User ID is required');
    }

    if (limit < 1 || limit > 100) {
      throw new ValidationError('Limit must be between 1 and 100');
    }

    if (offset < 0) {
      throw new ValidationError('Offset must be non-negative');
    }

    const players = await this.repository.getPlayerRatingsForHost(userId, limit, offset);

    return {
      players,
      total: players.length,
    };
  }

  async getReviewStats(userId: string): Promise<HostReviewStats> {
    if (!userId || typeof userId !== 'string') {
      throw new ValidationError('User ID is required');
    }

    return this.repository.getHostReviewStats(userId);
  }

  private async getUpcomingEvents(userId: string): Promise<HostEventAnalytics[]> {
    const allEvents = await this.repository.getHostEventAnalytics(userId);
    return allEvents
      .filter((event) => new Date(event.startTime) > new Date())
      .slice(0, 5);
  }

  private async getPastEvents(userId: string): Promise<HostEventAnalytics[]> {
    const allEvents = await this.repository.getHostEventAnalytics(userId);
    return allEvents
      .filter((event) => new Date(event.startTime) <= new Date())
      .slice(0, 5);
  }
}
