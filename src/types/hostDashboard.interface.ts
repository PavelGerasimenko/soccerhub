export interface HostDashboardStats {
  totalEvents: number;
  totalEarnings: number;
  totalBookings: number;
  avgRating: number;
  totalReviews: number;
  upcomingEvents: number;
  pastEvents: number;
}

export interface HostEarningsData {
  eventId: string;
  eventTitle: string;
  eventDate: Date;
  bookingPrice: number;
  totalBookings: number;
  totalRevenue: number;
  hostCommission: number;
  platformFee: number;
  netEarnings: number;
}

export interface HostEventAnalytics {
  eventId: string;
  title: string;
  startTime: Date;
  maxCapacity: number;
  currentParticipants: number;
  fillPercentage: number;
  price: number;
  status: string;
  totalRevenue: number;
  hostEarnings: number;
}

export interface PlayerRatingForHost {
  playerId: string;
  playerName: string;
  playerEmail: string;
  profilePicture?: string;
  avgRatingGiven: number;
  totalReviews: number;
  lastReviewDate: Date;
}

export interface HostReviewStats {
  totalReviews: number;
  avgRating: number;
  ratingDistribution: {
    fiveStar: number;
    fourStar: number;
    threeStar: number;
    twoStar: number;
    oneStar: number;
  };
  recentReviews: HostReview[];
}

export interface HostReview {
  id: string;
  reviewerId: string;
  reviewerName: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface HostDashboardOverview {
  userId: string;
  stats: HostDashboardStats;
  earningsData: HostEarningsData[];
  upcomingEvents: HostEventAnalytics[];
  pastEvents: HostEventAnalytics[];
  reviewStats: HostReviewStats;
}

export interface GetDashboardRequest {
  userId: string;
  period?: 'week' | 'month' | 'quarter' | 'year' | 'all';
}

export interface GetEarningsRequest {
  userId: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface GetPlayerRatingsRequest {
  userId: string;
  limit?: number;
  offset?: number;
  sortBy?: 'recent' | 'rating' | 'count';
}
