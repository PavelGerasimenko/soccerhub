import HostDashboardService from './hostDashboard.service';
import HostDashboardRepository from './hostDashboard.repository';
import { ValidationError, NotFoundError } from '../../utils/errors';

describe('HostDashboardService', () => {
  let service: HostDashboardService;
  let repository: jest.Mocked<HostDashboardRepository>;

  const mockUserId = '550e8400-e29b-41d4-a716-446655440000';

  const mockDashboardStats = {
    totalEvents: 5,
    totalEarnings: 1000,
    totalBookings: 25,
    avgRating: 4.5,
    totalReviews: 10,
    upcomingEvents: 2,
    pastEvents: 3,
  };

  const mockEarningsData = [
    {
      eventId: '550e8400-e29b-41d4-a716-446655440001',
      eventTitle: 'Friday Soccer Game',
      eventDate: new Date('2026-08-01'),
      bookingPrice: 50,
      totalBookings: 10,
      totalRevenue: 500,
      hostCommission: 75,
      platformFee: 25,
      netEarnings: 400,
    },
  ];

  const mockEventAnalytics = [
    {
      eventId: '550e8400-e29b-41d4-a716-446655440001',
      title: 'Friday Soccer Game',
      startTime: new Date('2026-08-01'),
      maxCapacity: 20,
      currentParticipants: 10,
      fillPercentage: 50,
      price: 50,
      status: 'active',
      totalRevenue: 500,
      hostEarnings: 75,
    },
  ];

  const mockPlayerRatings = [
    {
      playerId: '550e8400-e29b-41d4-a716-446655440002',
      playerName: 'John Doe',
      playerEmail: 'john@example.com',
      profilePicture: 'https://example.com/pic.jpg',
      avgRatingGiven: 4.5,
      totalReviews: 3,
      lastReviewDate: new Date('2026-07-20'),
    },
  ];

  const mockReviewStats = {
    totalReviews: 10,
    avgRating: 4.5,
    ratingDistribution: {
      fiveStar: 6,
      fourStar: 3,
      threeStar: 1,
      twoStar: 0,
      oneStar: 0,
    },
    recentReviews: [
      {
        id: 'review-1',
        reviewerId: '550e8400-e29b-41d4-a716-446655440003',
        reviewerName: 'Jane Smith',
        rating: 5,
        comment: 'Great host!',
        createdAt: new Date('2026-07-20'),
      },
    ],
  };

  beforeEach(() => {
    repository = {
      getDashboardStats: jest.fn(),
      getHostEarnings: jest.fn(),
      getHostEventAnalytics: jest.fn(),
      getPlayerRatingsForHost: jest.fn(),
      getHostReviewStats: jest.fn(),
    } as any;

    service = new HostDashboardService(repository);
  });

  describe('getDashboardOverview', () => {
    it('should return dashboard overview for valid user', async () => {
      repository.getDashboardStats.mockResolvedValue(mockDashboardStats);
      repository.getHostEarnings.mockResolvedValue(mockEarningsData);
      repository.getHostEventAnalytics.mockResolvedValue([
        { ...mockEventAnalytics[0], startTime: new Date('2026-08-15') },
        { ...mockEventAnalytics[0], startTime: new Date('2026-07-10') },
      ]);
      repository.getHostReviewStats.mockResolvedValue(mockReviewStats);

      const result = await service.getDashboardOverview(mockUserId);

      expect(result.userId).toBe(mockUserId);
      expect(result.stats).toEqual(mockDashboardStats);
      expect(result.earningsData).toHaveLength(1);
      expect(result.reviewStats).toEqual(mockReviewStats);
    });

    it('should throw error if user has no events', async () => {
      repository.getDashboardStats.mockResolvedValue({
        ...mockDashboardStats,
        totalEvents: 0,
      });
      repository.getHostEarnings.mockResolvedValue([]);
      repository.getHostEventAnalytics.mockResolvedValue([]);
      repository.getHostReviewStats.mockResolvedValue(mockReviewStats);

      await expect(service.getDashboardOverview(mockUserId)).rejects.toThrow(NotFoundError);
    });

    it('should throw validation error for invalid user ID', async () => {
      await expect(service.getDashboardOverview('')).rejects.toThrow(ValidationError);
    });
  });

  describe('getEarnings', () => {
    it('should return earnings data with pagination', async () => {
      repository.getHostEarnings.mockResolvedValue(mockEarningsData);

      const result = await service.getEarnings(mockUserId, undefined, undefined, 50, 0);

      expect(result.earnings).toEqual(mockEarningsData);
      expect(result.total).toBe(1);
      expect(result.totalEarnings).toBe(400);
    });

    it('should validate limit parameter', async () => {
      await expect(service.getEarnings(mockUserId, undefined, undefined, 101, 0)).rejects.toThrow(
        ValidationError,
      );
      await expect(
        service.getEarnings(mockUserId, undefined, undefined, 0, 0),
      ).rejects.toThrow(ValidationError);
    });

    it('should validate offset parameter', async () => {
      await expect(
        service.getEarnings(mockUserId, undefined, undefined, 50, -1),
      ).rejects.toThrow(ValidationError);
    });

    it('should validate date range', async () => {
      const startDate = new Date('2026-08-01');
      const endDate = new Date('2026-07-01');

      await expect(
        service.getEarnings(mockUserId, startDate, endDate, 50, 0),
      ).rejects.toThrow(ValidationError);
    });

    it('should throw error for invalid user ID', async () => {
      await expect(service.getEarnings('', undefined, undefined, 50, 0)).rejects.toThrow(
        ValidationError,
      );
    });
  });

  describe('getEventAnalytics', () => {
    it('should return event analytics', async () => {
      repository.getHostEventAnalytics.mockResolvedValue(mockEventAnalytics);

      const result = await service.getEventAnalytics(mockUserId);

      expect(result).toEqual(mockEventAnalytics);
      expect(repository.getHostEventAnalytics).toHaveBeenCalledWith(mockUserId);
    });

    it('should throw error for invalid user ID', async () => {
      await expect(service.getEventAnalytics('')).rejects.toThrow(ValidationError);
    });
  });

  describe('getPlayerRatings', () => {
    it('should return player ratings with pagination', async () => {
      repository.getPlayerRatingsForHost.mockResolvedValue(mockPlayerRatings);

      const result = await service.getPlayerRatings(mockUserId, 50, 0);

      expect(result.players).toEqual(mockPlayerRatings);
      expect(result.total).toBe(1);
    });

    it('should validate limit parameter', async () => {
      await expect(service.getPlayerRatings(mockUserId, 101, 0)).rejects.toThrow(
        ValidationError,
      );
    });

    it('should validate offset parameter', async () => {
      await expect(service.getPlayerRatings(mockUserId, 50, -1)).rejects.toThrow(
        ValidationError,
      );
    });

    it('should throw error for invalid user ID', async () => {
      await expect(service.getPlayerRatings('', 50, 0)).rejects.toThrow(ValidationError);
    });
  });

  describe('getReviewStats', () => {
    it('should return review statistics', async () => {
      repository.getHostReviewStats.mockResolvedValue(mockReviewStats);

      const result = await service.getReviewStats(mockUserId);

      expect(result).toEqual(mockReviewStats);
      expect(result.avgRating).toBe(4.5);
      expect(result.ratingDistribution.fiveStar).toBe(6);
    });

    it('should throw error for invalid user ID', async () => {
      await expect(service.getReviewStats('')).rejects.toThrow(ValidationError);
    });
  });
});
