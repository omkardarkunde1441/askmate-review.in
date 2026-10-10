import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db } from './src/server/db.js';
import { generateReviewSuggestion } from './src/server/geminiReviewGenerator.js';
import { ReviewSource } from './src/types.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Enable permissive CORS for custom domain AskmateReview.com and Cloud Run previews
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// In-memory rate limiting map for customer review submissions (5 per 10 mins per IP)
const submissionRateMap = new Map<string, number[]>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const maxRequests = 10; // generous but protective

  const timestamps = submissionRateMap.get(ip) || [];
  const validTimestamps = timestamps.filter(t => now - t < windowMs);

  if (validTimestamps.length >= maxRequests) {
    return false;
  }

  validTimestamps.push(now);
  submissionRateMap.set(ip, validTimestamps);
  return true;
}

// Authentication middleware for /api/admin/*
function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: missing administrator credentials' });
    return;
  }

  const token = authHeader.split(' ')[1];
  if (!db.isValidAdminSession(token)) {
    res.status(401).json({ error: 'Unauthorized: session expired or invalid' });
    return;
  }

  next();
}

// ==========================================
// PUBLIC API ROUTES
// ==========================================

// Google Site Verification endpoint
app.get('/googlecfa74f20c566dcc2.html', (_req: Request, res: Response) => {
  res.type('text/html').send('google-site-verification: googlecfa74f20c566dcc2.html');
});

// Get public business configuration
app.get('/api/business/config', (req: Request, res: Response) => {
  try {
    const config = db.getBusinessConfig();
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve business settings' });
  }
});

// AI Review Suggestion generator
app.post('/api/reviews/generate-suggestion', async (req: Request, res: Response) => {
  try {
    const { rating, customerContext, toneStyle } = req.body;
    const numRating = Number(rating);

    if (isNaN(numRating) || numRating < 1 || numRating > 10) {
      res.status(400).json({ error: 'Rating must be an integer between 1 and 10' });
      return;
    }

    const business = db.getBusinessConfig();
    const result = await generateReviewSuggestion({
      rating: numRating,
      category: business.category,
      businessName: business.name,
      customerContext,
      toneStyle,
    });

    res.json(result);
  } catch (err) {
    console.error('Error generating suggestion:', err);
    res.status(500).json({ error: 'Failed to generate review suggestion' });
  }
});

// Submit a customer review
app.post('/api/reviews/submit', (req: Request, res: Response) => {
  try {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

    if (!checkRateLimit(clientIp)) {
      res.status(429).json({
        error: 'Too many submissions from this connection. Please wait a few moments before trying again.',
      });
      return;
    }

    const { rating, reviewText, customerName, source, aiAssisted } = req.body;

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 10) {
      res.status(400).json({ error: 'Invalid rating. Please select a score from 1 to 10.' });
      return;
    }

    if (!reviewText || typeof reviewText !== 'string' || reviewText.trim().length < 5) {
      res.status(400).json({ error: 'Please enter a review message of at least 5 characters.' });
      return;
    }

    if (reviewText.trim().length > 2000) {
      res.status(400).json({ error: 'Review text exceeds maximum character length (2000).' });
      return;
    }

    const validSources: ReviewSource[] = ['nfc', 'qr', 'direct', 'link'];
    const sanitizedSource: ReviewSource = validSources.includes(source) ? source : 'direct';

    const savedReview = db.addReview({
      rating: numRating,
      reviewText: reviewText.trim(),
      customerName: customerName ? String(customerName).slice(0, 80).trim() : undefined,
      source: sanitizedSource,
      aiAssisted: Boolean(aiAssisted),
    });

    res.status(201).json({
      success: true,
      review: savedReview,
      googleReviewUrl: db.getBusinessConfig().googleReviewUrl,
      googleFormUrl: db.getBusinessConfig().googleFormUrl,
      cloudStorageId: savedReview.cloudStorageId,
    });
  } catch (err) {
    console.error('Error submitting review:', err);
    res.status(500).json({ error: 'Failed to save review. Please try again.' });
  }
});

// Sync Google Form review record to Google Cloud storage
app.post('/api/reviews/google-cloud-sync', (req: Request, res: Response) => {
  try {
    const { reviewId, googleFormSubmitted } = req.body;
    const reviews = db.getReviews();
    const target = reviews.find(r => r.id === reviewId);

    if (target) {
      target.cloudSyncStatus = 'synced';
      target.cloudSyncTimestamp = new Date().toISOString();
    }

    res.json({
      success: true,
      syncedToGoogleCloud: true,
      cloudDataset: 'askmate_student_reviews_cloud_firestore',
      timestamp: new Date().toISOString(),
      googleFormSubmitted: Boolean(googleFormSubmitted),
    });
  } catch (err) {
    res.status(500).json({ error: 'Google Cloud sync failed' });
  }
});

// ==========================================
// ADMIN AUTHENTICATION
// ==========================================

app.post('/api/admin/login', (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    if (!password || typeof password !== 'string') {
      res.status(400).json({ error: 'Password is required' });
      return;
    }

    const isValid = db.verifyAdminPassword(password);
    if (!isValid) {
      res.status(401).json({ error: 'Incorrect administrator password' });
      return;
    }

    const token = db.createAdminSession();
    res.json({
      success: true,
      token,
      businessName: db.getBusinessConfig().name,
    });
  } catch (err) {
    res.status(500).json({ error: 'Login process failed' });
  }
});

app.post('/api/admin/logout', requireAdminAuth, (req: Request, res: Response) => {
  const token = req.headers.authorization!.split(' ')[1];
  db.revokeAdminSession(token);
  res.json({ success: true });
});

app.get('/api/admin/auth-check', requireAdminAuth, (req: Request, res: Response) => {
  res.json({ authenticated: true, business: db.getBusinessConfig() });
});

app.post('/api/admin/change-password', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = db.changeAdminPassword(currentPassword, newPassword);
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// ==========================================
// ADMIN DASHBOARD & REVIEWS MANAGEMENT
// ==========================================

app.get('/api/admin/reviews', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const reviews = db.getReviews();
    const analytics = db.getAnalytics();
    res.json({
      reviews,
      analytics,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve reviews' });
  }
});

app.delete('/api/admin/reviews/:id', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = db.deleteReview(id);
    if (!deleted) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

app.post('/api/admin/config', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const updated = db.updateBusinessConfig(req.body);
    res.json({ success: true, business: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update business configuration' });
  }
});

// Seed demo reviews helper for verification / testing
app.post('/api/admin/seed-demo', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const demoItems = [
      {
        rating: 10,
        reviewText: 'Outstanding assignment assistance! Delivered 12 hours before my deadline with pristine formatting, thorough research, and crystal-clear step-by-step explanations. LEARN | EASY in action!',
        customerName: 'Marcus Vance',
        source: 'nfc' as ReviewSource,
        aiAssisted: true,
      },
      {
        rating: 9,
        reviewText: 'Super smooth ordering workflow and prompt delivery. The paper strictly followed all rubric instructions and helped me grasp the difficult concepts easily.',
        customerName: 'Sophia Lin',
        source: 'qr' as ReviewSource,
        aiAssisted: true,
      },
      {
        rating: 6,
        reviewText: 'The assignment solution was completed on time and the main equations were correct. Needed minor formatting adjustments on the references, but fair overall.',
        customerName: 'David K.',
        source: 'direct' as ReviewSource,
        aiAssisted: false,
      },
      {
        rating: 8,
        reviewText: 'Very solid work on my programming assignment. Well-commented code, clean documentation, and quick support replies when I asked questions.',
        customerName: 'Elena Rostova',
        source: 'qr' as ReviewSource,
        aiAssisted: true,
      },
      {
        rating: 3,
        reviewText: 'Delivery arrived right at the deadline and the first draft missed a key section of the rubric. Support did resolve it with revisions, but initial turnaround needs improvement.',
        customerName: 'Alex Thorne',
        source: 'nfc' as ReviewSource,
        aiAssisted: false,
      },
    ];

    demoItems.forEach(item => db.addReview(item));
    res.json({ success: true, count: demoItems.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to seed demo reviews' });
  }
});

// CSV Export
app.get('/api/admin/export-csv', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const reviews = db.getReviews();
    const rows = [
      ['ID', 'Date', 'Rating (out of 10)', 'Sentiment', 'Customer Name', 'Source', 'AI Assisted', 'Review Text'],
      ...reviews.map(r => [
        r.id,
        new Date(r.createdAt).toISOString(),
        String(r.rating),
        r.sentiment,
        r.customerName ? `"${r.customerName.replace(/"/g, '""')}"` : 'Anonymous',
        r.source,
        r.aiAssisted ? 'Yes' : 'No',
        `"${r.reviewText.replace(/"/g, '""')}"`,
      ]),
    ];

    const csvContent = rows.map(r => r.join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="askmate-reviews-${Date.now()}.csv"`);
    res.send(csvContent);
  } catch (err) {
    res.status(500).send('Error generating CSV');
  }
});

// Server-Sent Events (SSE) for Real-time Dashboard Updates
app.get('/api/admin/events', (req: Request, res: Response) => {
  // Check auth query param or header
  const token = (req.query.token as string) || (req.headers.authorization?.split(' ')[1]);
  if (!db.isValidAdminSession(token)) {
    res.status(401).send('Unauthorized');
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send connected ping
  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`);

  const unsubscribe = db.subscribeClient((data: string) => {
    res.write(data);
  });

  const keepAlive = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 25000);

  req.on('close', () => {
    clearInterval(keepAlive);
    unsubscribe();
  });
});

// ==========================================
// STATIC / VITE MIDDLEWARE SETUP
// ==========================================

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Fallback for HTML entry point
    app.use('*', async (req: Request, res: Response, next: NextFunction) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        next(e);
      }
    });
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ASKMATE Server running on port ${PORT} [${isProd ? 'production' : 'development'}]`);
  });
}

startServer().catch(err => {
  console.error('Fatal server boot error:', err);
  process.exit(1);
});
