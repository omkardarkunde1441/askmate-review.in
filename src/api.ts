import { BusinessConfig, Review, ReviewAnalytics, ReviewSuggestionResponse } from './types';

export const api = {
  async getBusinessConfig(): Promise<BusinessConfig> {
    const res = await fetch('/api/business/config');
    if (!res.ok) throw new Error('Failed to load business settings');
    return res.json();
  },

  async generateSuggestion(rating: number, customerContext?: string): Promise<ReviewSuggestionResponse> {
    const res = await fetch('/api/reviews/generate-suggestion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, customerContext }),
    });
    if (!res.ok) throw new Error('Failed to generate review suggestion');
    return res.json();
  },

  async submitReview(data: {
    rating: number;
    reviewText: string;
    customerName?: string;
    source?: string;
    aiAssisted?: boolean;
  }): Promise<{ success: boolean; review: Review; googleReviewUrl?: string; googleFormUrl?: string; cloudStorageId?: string }> {
    const res = await fetch('/api/reviews/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to submit review');
    return json;
  },

  async syncGoogleCloud(reviewId: string, googleFormSubmitted = true): Promise<{ success: boolean; syncedToGoogleCloud: boolean; cloudDataset: string }> {
    const res = await fetch('/api/reviews/google-cloud-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewId, googleFormSubmitted }),
    });
    return res.json();
  },

  async adminLogin(password: string): Promise<{ success: boolean; token: string; businessName: string }> {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Authentication failed');
    return json;
  },

  async adminLogout(token: string): Promise<void> {
    await fetch('/api/admin/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  },

  async checkAdminAuth(token: string): Promise<{ authenticated: boolean; business: BusinessConfig }> {
    const res = await fetch('/api/admin/auth-check', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Invalid session');
    return res.json();
  },

  async getAdminReviews(token: string): Promise<{ reviews: Review[]; analytics: ReviewAnalytics }> {
    const res = await fetch('/api/admin/reviews', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to load reviews');
    return res.json();
  },

  async deleteReview(token: string, id: string): Promise<void> {
    const res = await fetch(`/api/admin/reviews/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to delete review');
  },

  async updateBusinessConfig(token: string, updates: Partial<BusinessConfig>): Promise<BusinessConfig> {
    const res = await fetch('/api/admin/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update business configuration');
    return json.business;
  },

  async changeAdminPassword(token: string, currentPassword: string, newPassword: string): Promise<void> {
    const res = await fetch('/api/admin/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to change password');
  },

  async seedDemoReviews(token: string): Promise<void> {
    const res = await fetch('/api/admin/seed-demo', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to seed reviews');
  },
};
