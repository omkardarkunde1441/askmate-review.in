export type ReviewSource = 'nfc' | 'qr' | 'direct' | 'link';

export interface Review {
  id: string;
  businessId: string;
  rating: number; // 1 to 10
  reviewText: string;
  customerName?: string;
  createdAt: string; // ISO string
  source: ReviewSource;
  aiAssisted: boolean;
  sentiment: 'positive' | 'neutral' | 'negative';
  cloudSyncStatus?: 'synced' | 'pending';
  cloudStorageId?: string;
  cloudSyncTimestamp?: string;
}

export interface BusinessConfig {
  businessId: string;
  name: string;
  category: string;
  welcomeMessage: string;
  googleReviewUrl: string;
  googleFormUrl?: string;
  googleFormEntryIdReview?: string;
  googleFormEntryIdRating?: string;
  googleFormEntryIdName?: string;
  brandColor: string;
  logoUrl?: string;
  positiveThreshold: number; // default 8 (8-10 is positive)
  neutralThreshold: number;  // default 5 (5-7 is neutral, 1-4 is negative)
  updatedAt: string;
}

export interface GoogleCloudRecord {
  id: string;
  reviewId: string;
  datasetName: string;
  timestamp: string;
  rating: number;
  sentiment: string;
  reviewText: string;
  customerName?: string;
  status: 'stored_gcloud_firestore';
}

export interface ReviewAnalytics {
  totalReviews: number;
  todayReviews: number;
  averageRating: number;
  ratingDistribution: Record<number, number>; // 1 -> count, ... 10 -> count
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  recentActivity: Review[];
  dailyTrend: { date: string; count: number; avgRating: number }[];
  cloudSyncedCount?: number;
}

export interface ReviewSuggestionRequest {
  rating: number;
  category?: string;
  businessName?: string;
  customerContext?: string;
  toneStyle?: 'standard' | 'detailed' | 'concise';
}

export interface ReviewSuggestionResponse {
  suggestion: string;
  aiPowered: boolean;
  modelUsed?: string;
}
