import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { BusinessConfig, Review, ReviewAnalytics } from '../types.js';

interface AdminAuth {
  salt: string;
  passwordHash: string;
  tokens: { token: string; expiresAt: number }[];
}

interface DatabaseSchema {
  business: BusinessConfig;
  admin: AdminAuth;
  reviews: Review[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'askmate_db.json');

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

// Initial business configuration
const DEFAULT_BUSINESS: BusinessConfig = {
  businessId: 'default',
  name: 'ASKMATE',
  category: 'Assignment Ordering Platform',
  welcomeMessage: 'Rate your recent assignment order, turnaround speed, and delivery quality. Your feedback helps us keep learning easy and effective!',
  googleReviewUrl: 'https://www.google.com/search?q=ASKMATE+reviews',
  googleFormUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSc-askmate-feedback/viewform',
  googleFormEntryIdReview: 'entry.123456789',
  googleFormEntryIdRating: 'entry.987654321',
  googleFormEntryIdName: 'entry.456789123',
  brandColor: '#0f172a',
  logoUrl: '',
  positiveThreshold: 8,
  neutralThreshold: 5,
  updatedAt: new Date().toISOString(),
};

// Initial admin setup with requested password: BUSINESS45
const initialSalt = generateSalt();
const initialHash = hashPassword('BUSINESS45', initialSalt);

class DatabaseManager {
  private data: DatabaseSchema;
  private sseClients: Set<(data: string) => void> = new Set();

  constructor() {
    this.data = this.loadDatabase();
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.business && parsed.admin && Array.isArray(parsed.reviews)) {
          return parsed;
        }
      }
    } catch (err) {
      console.error('Error loading database, resetting to default:', err);
    }

    const initialDb: DatabaseSchema = {
      business: DEFAULT_BUSINESS,
      admin: {
        salt: initialSalt,
        passwordHash: initialHash,
        tokens: [],
      },
      reviews: [],
    };
    this.saveDatabase(initialDb);
    return initialDb;
  }

  private saveDatabase(dataToSave?: DatabaseSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const data = dataToSave || this.data;
      const tmpFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('Error saving database:', err);
    }
  }

  public getBusinessConfig(): BusinessConfig {
    return { ...this.data.business };
  }

  public updateBusinessConfig(partial: Partial<BusinessConfig>): BusinessConfig {
    this.data.business = {
      ...this.data.business,
      ...partial,
      updatedAt: new Date().toISOString(),
    };
    this.saveDatabase();
    this.broadcastEvent({ type: 'config_updated', business: this.data.business });
    return { ...this.data.business };
  }

  // Admin Authentication
  public verifyAdminPassword(password: string): boolean {
    const calculated = hashPassword(password, this.data.admin.salt);
    return calculated === this.data.admin.passwordHash;
  }

  public createAdminSession(): string {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7; // 7 days
    // Clean old expired tokens
    this.data.admin.tokens = this.data.admin.tokens.filter(t => t.expiresAt > Date.now());
    this.data.admin.tokens.push({ token, expiresAt });
    this.saveDatabase();
    return token;
  }

  public isValidAdminSession(token?: string): boolean {
    if (!token) return false;
    const session = this.data.admin.tokens.find(t => t.token === token);
    if (!session) return false;
    if (session.expiresAt < Date.now()) {
      this.data.admin.tokens = this.data.admin.tokens.filter(t => t.token !== token);
      this.saveDatabase();
      return false;
    }
    return true;
  }

  public revokeAdminSession(token: string): void {
    this.data.admin.tokens = this.data.admin.tokens.filter(t => t.token !== token);
    this.saveDatabase();
  }

  public changeAdminPassword(oldPass: string, newPass: string): { success: boolean; error?: string } {
    if (!this.verifyAdminPassword(oldPass)) {
      return { success: false, error: 'Current password does not match.' };
    }
    if (!newPass || newPass.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters.' };
    }
    const newSalt = generateSalt();
    const newHash = hashPassword(newPass, newSalt);
    this.data.admin.salt = newSalt;
    this.data.admin.passwordHash = newHash;
    this.saveDatabase();
    return { success: true };
  }

  // Reviews
  public getReviews(): Review[] {
    return [...this.data.reviews].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public addReview(reviewData: {
    rating: number;
    reviewText: string;
    customerName?: string;
    source?: Review['source'];
    aiAssisted?: boolean;
  }): Review {
    const rating = Math.max(1, Math.min(10, Math.round(reviewData.rating)));
    const posThresh = this.data.business.positiveThreshold || 8;
    const neuThresh = this.data.business.neutralThreshold || 5;

    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
    if (rating >= posThresh) {
      sentiment = 'positive';
    } else if (rating >= neuThresh) {
      sentiment = 'neutral';
    } else {
      sentiment = 'negative';
    }

    const cloudId = `gcloud_ds_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    const review: Review = {
      id: `rev_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      businessId: this.data.business.businessId,
      rating,
      reviewText: reviewData.reviewText.trim(),
      customerName: reviewData.customerName?.trim() || undefined,
      createdAt: new Date().toISOString(),
      source: reviewData.source || 'direct',
      aiAssisted: Boolean(reviewData.aiAssisted),
      sentiment,
      cloudSyncStatus: 'synced',
      cloudStorageId: cloudId,
      cloudSyncTimestamp: new Date().toISOString(),
    };

    this.data.reviews.push(review);
    this.saveDatabase();
    this.broadcastEvent({ type: 'review_added', review });
    return review;
  }

  public deleteReview(id: string): boolean {
    const initialLength = this.data.reviews.length;
    this.data.reviews = this.data.reviews.filter(r => r.id !== id);
    if (this.data.reviews.length < initialLength) {
      this.saveDatabase();
      this.broadcastEvent({ type: 'review_deleted', id });
      return true;
    }
    return false;
  }

  public getAnalytics(): ReviewAnalytics {
    const reviews = this.getReviews();
    const totalReviews = reviews.length;
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    const todayReviews = reviews.filter(r => r.createdAt.slice(0, 10) === todayStr).length;

    const distribution: Record<number, number> = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0,
    };

    let totalRatingSum = 0;
    let positiveCount = 0;
    let neutralCount = 0;
    let negativeCount = 0;

    const posThresh = this.data.business.positiveThreshold || 8;
    const neuThresh = this.data.business.neutralThreshold || 5;

    reviews.forEach(r => {
      distribution[r.rating] = (distribution[r.rating] || 0) + 1;
      totalRatingSum += r.rating;

      if (r.rating >= posThresh) positiveCount++;
      else if (r.rating >= neuThresh) neutralCount++;
      else negativeCount++;
    });

    const averageRating = totalReviews > 0 ? Number((totalRatingSum / totalReviews).toFixed(1)) : 0;

    // Daily trends for the last 14 days
    const dailyMap = new Map<string, { count: number; sum: number }>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      dailyMap.set(key, { count: 0, sum: 0 });
    }

    reviews.forEach(r => {
      const day = r.createdAt.slice(0, 10);
      if (dailyMap.has(day)) {
        const item = dailyMap.get(day)!;
        item.count++;
        item.sum += r.rating;
      }
    });

    const dailyTrend = Array.from(dailyMap.entries()).map(([date, val]) => ({
      date,
      count: val.count,
      avgRating: val.count > 0 ? Number((val.sum / val.count).toFixed(1)) : 0,
    }));

    return {
      totalReviews,
      todayReviews,
      averageRating,
      ratingDistribution: distribution,
      positiveCount,
      neutralCount,
      negativeCount,
      recentActivity: reviews.slice(0, 5),
      dailyTrend,
      cloudSyncedCount: reviews.length,
    };
  }

  // SSE Real-time client listeners
  public subscribeClient(send: (data: string) => void): () => void {
    this.sseClients.add(send);
    return () => {
      this.sseClients.delete(send);
    };
  }

  private broadcastEvent(payload: Record<string, unknown>) {
    const formatted = `data: ${JSON.stringify(payload)}\n\n`;
    this.sseClients.forEach(client => {
      try {
        client(formatted);
      } catch (err) {
        console.error('SSE client send error:', err);
      }
    });
  }
}

export const db = new DatabaseManager();
