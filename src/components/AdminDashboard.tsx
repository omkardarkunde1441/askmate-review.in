import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Star,
  Users,
  Calendar,
  TrendingUp,
  Download,
  Trash2,
  Copy,
  Check,
  Search,
  Filter,
  SlidersHorizontal,
  ExternalLink,
  LogOut,
  QrCode,
  Settings,
  Sparkles,
  Radio,
  Eye,
  AlertTriangle,
  RefreshCw,
  PlusCircle,
  Building2,
} from 'lucide-react';
import { BusinessConfig, Review, ReviewAnalytics } from '../types';
import { api } from '../api';
import { AskMateLogo } from './AskMateLogo';
import { BusinessSettingsModal } from './BusinessSettingsModal';
import { QrNfcModal } from './QrNfcModal';
import { GoogleSearchSimulator } from './GoogleSearchSimulator';

interface AdminDashboardProps {
  token: string;
  business: BusinessConfig;
  onLogout: () => void;
  onViewCustomerPage: () => void;
  onBusinessUpdated: (b: BusinessConfig) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  token,
  business,
  onLogout,
  onViewCustomerPage,
  onBusinessUpdated,
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [analytics, setAnalytics] = useState<ReviewAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [sseConnected, setSseConnected] = useState<boolean>(false);

  // Modals
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Review | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [isSearchSimulatorOpen, setIsSearchSimulatorOpen] = useState<boolean>(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');

  // Copy text toast state
  const [copiedReviewId, setCopiedReviewId] = useState<string | null>(null);

  // Load reviews from API
  const loadData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const data = await api.getAdminReviews(token);
      setReviews(data.reviews);
      setAnalytics(data.analytics);
    } catch (err) {
      console.error('Failed to load admin reviews:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  // Real-time updates via Server-Sent Events (SSE)
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`/api/admin/events?token=${token}`);

      eventSource.onopen = () => {
        setSseConnected(true);
      };

      eventSource.onmessage = event => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'connected') {
            setSseConnected(true);
          } else if (payload.type === 'review_added') {
            // Silently reload review dataset
            loadData(true);
          } else if (payload.type === 'review_deleted') {
            setReviews(prev => prev.filter(r => r.id !== payload.id));
            loadData(true);
          } else if (payload.type === 'config_updated') {
            if (payload.business) {
              onBusinessUpdated(payload.business);
            }
          }
        } catch (e) {
          // ignore keepalive
        }
      };

      eventSource.onerror = () => {
        setSseConnected(false);
      };
    } catch (err) {
      console.warn('SSE connection initialization error:', err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [token]);

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews
      .filter(r => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = r.customerName?.toLowerCase().includes(q);
          const matchText = r.reviewText.toLowerCase().includes(q);
          if (!matchName && !matchText) return false;
        }

        // Rating filter
        if (ratingFilter === 'high' && r.rating < 8) return false;
        if (ratingFilter === 'mid' && (r.rating < 5 || r.rating > 7)) return false;
        if (ratingFilter === 'low' && r.rating > 4) return false;
        if (ratingFilter !== 'all' && ratingFilter !== 'high' && ratingFilter !== 'mid' && ratingFilter !== 'low') {
          if (r.rating !== Number(ratingFilter)) return false;
        }

        // Source filter
        if (sourceFilter !== 'all' && r.source !== sourceFilter) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (sortBy === 'highest') return b.rating - a.rating;
        if (sortBy === 'lowest') return a.rating - b.rating;
        return 0;
      });
  }, [reviews, searchQuery, ratingFilter, sourceFilter, sortBy]);

  const handleDeleteConfirm = async () => {
    if (!deleteCandidate) return;
    setIsDeleting(true);

    try {
      await api.deleteReview(token, deleteCandidate.id);
      setReviews(prev => prev.filter(r => r.id !== deleteCandidate.id));
      if (selectedReview?.id === deleteCandidate.id) {
        setSelectedReview(null);
      }
      setDeleteCandidate(null);
      loadData(true);
    } catch (err) {
      console.error('Delete review error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyReview = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedReviewId(id);
    setTimeout(() => setCopiedReviewId(null), 2000);
  };

  const handleSeedDemo = async () => {
    try {
      await api.seedDemoReviews(token);
      loadData(true);
    } catch (err) {
      console.error('Seed demo reviews error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/50 backdrop-blur-xs text-neutral-900 pb-16">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-neutral-200/80 px-4 sm:px-8 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Left: Brand & Business info */}
          <div className="flex items-center gap-3">
            <AskMateLogo size="sm" showTagline={true} />
            <div className="hidden sm:block h-5 w-px bg-neutral-200" />
            <div className="hidden sm:flex flex-col">
              <span className="text-xs font-bold text-neutral-800 leading-tight">
                Assignment Ordering Admin
              </span>
              <span className="text-[11px] text-neutral-500 leading-tight">
                Real-time Feedback & Analytics
              </span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live SSE indicator */}
            <div
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                sseConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-neutral-50 text-neutral-500 border-neutral-200'
              }`}
              title={sseConnected ? 'Real-time database listener active' : 'Connecting to real-time events'}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  sseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'
                }`}
              />
              <span>{sseConnected ? 'Real-time Sync' : 'Polling'}</span>
            </div>

            {/* Google Search Discovery */}
            <button
              onClick={() => setIsSearchSimulatorOpen(true)}
              className="px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Preview Google Search suggestions for ASKMATE"
            >
              <Search className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Google Suggestions</span>
            </button>

            {/* QR & NFC Modal trigger */}
            <button
              onClick={() => setIsQrModalOpen(true)}
              className="px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <QrCode className="w-3.5 h-3.5 text-neutral-600" />
              <span className="hidden sm:inline">QR & NFC Tools</span>
            </button>

            {/* Business Settings */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-neutral-600" />
              <span className="hidden sm:inline">Settings</span>
            </button>

            {/* View Customer Page */}
            <button
              onClick={onViewCustomerPage}
              className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Customer View</span>
            </button>

            {/* Logout */}
            <button
              onClick={onLogout}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors"
              title="Sign out of Admin Dashboard"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 sm:pt-8 space-y-6">
        {/* KPI Overview Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {/* Total Reviews */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200/90 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-neutral-500">
              <span className="text-xs font-medium uppercase tracking-wider">Total ASKMATE Reviews</span>
              <Users className="w-4 h-4 text-neutral-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-display font-extrabold text-neutral-900 tabular-nums">
                {analytics?.totalReviews ?? 0}
              </span>
              <span className="text-[11px] text-neutral-500 font-medium">submissions</span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Submitted locally via QR & NFC
            </p>
          </div>

          {/* Today's Reviews */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200/90 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-neutral-500">
              <span className="text-xs font-medium uppercase tracking-wider">Today's Activity</span>
              <Calendar className="w-4 h-4 text-neutral-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-display font-extrabold text-neutral-900 tabular-nums">
                {analytics?.todayReviews ?? 0}
              </span>
              <span className="text-[11px] text-emerald-600 font-semibold">new today</span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Live updates recorded
            </p>
          </div>

          {/* Average Rating */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200/90 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-neutral-500">
              <span className="text-xs font-medium uppercase tracking-wider">Average Rating</span>
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-display font-extrabold text-neutral-900 tabular-nums">
                {analytics?.averageRating ? analytics.averageRating : '—'}
              </span>
              <span className="text-xs font-bold text-neutral-400">/ 10.0</span>
            </div>
            <p className="text-[11px] text-neutral-400">
              10-star rating scale benchmark
            </p>
          </div>

          {/* Sentiment Breakdown */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200/90 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-neutral-500">
              <span className="text-xs font-medium uppercase tracking-wider">Sentiment Mix</span>
              <TrendingUp className="w-4 h-4 text-neutral-400" />
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold pt-1">
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                {analytics?.positiveCount ?? 0} Pos
              </span>
              <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                {analytics?.neutralCount ?? 0} Neu
              </span>
              <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                {analytics?.negativeCount ?? 0} Crit
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Thresholds: ≥{business.positiveThreshold || 8} Pos, ≥{business.neutralThreshold || 5} Neu
            </p>
          </div>
        </section>

        {/* 10-Star Rating Distribution & Analytics Chart */}
        <section className="bg-white rounded-2xl p-5 sm:p-6 border border-neutral-200/90 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-neutral-900">
                10-Star Score Distribution
              </h3>
              <p className="text-xs text-neutral-500">
                Volume of reviews received across every rating level from 1 to 10
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => loadData(true)}
                disabled={isRefreshing}
                className="text-xs font-medium text-neutral-600 hover:text-neutral-900 px-2.5 py-1.5 rounded-lg border border-neutral-200 flex items-center gap-1 hover:bg-neutral-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Refresh Data</span>
              </button>
            </div>
          </div>

          {/* Interactive Bar Chart for 1..10 Stars */}
          <div className="grid grid-cols-10 gap-1.5 sm:gap-3 pt-4 pb-2 items-end min-h-[140px] sm:min-h-[160px]">
            {Array.from({ length: 10 }, (_, i) => i + 1).map(star => {
              const count = analytics?.ratingDistribution?.[star] || 0;
              const maxCount = Math.max(1, ...Object.values(analytics?.ratingDistribution || {}));
              const heightPct = analytics?.totalReviews
                ? Math.max(12, Math.round((count / maxCount) * 100))
                : 10;

              let barColor = 'bg-neutral-200 text-neutral-600';
              if (count > 0) {
                if (star >= (business.positiveThreshold || 8)) barColor = 'bg-amber-400 text-amber-950 font-bold';
                else if (star >= (business.neutralThreshold || 5)) barColor = 'bg-yellow-400 text-yellow-950 font-bold';
                else barColor = 'bg-rose-400 text-white font-bold';
              }

              return (
                <div key={star} className="flex flex-col items-center gap-1.5 h-full justify-end">
                  <span className="text-[10px] sm:text-xs font-semibold tabular-nums text-neutral-700">
                    {count}
                  </span>
                  <div className="w-full bg-neutral-100 rounded-t-lg overflow-hidden flex items-end h-28 sm:h-32">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPct}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className={`w-full ${barColor} rounded-t-md transition-all flex items-center justify-center`}
                    />
                  </div>
                  <div className="flex items-center gap-0.5 text-neutral-600 text-[10px] sm:text-xs font-bold">
                    <span>{star}</span>
                    <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Reviews Management Table Section */}
        <section className="bg-white rounded-2xl border border-neutral-200/90 shadow-xs overflow-hidden space-y-4 p-5 sm:p-6">
          {/* Header & Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-neutral-900">Submitted Customer Reviews</h3>
              <p className="text-xs text-neutral-500">
                Filter, inspect, export, or manage verified customer feedback records
              </p>
            </div>

            {/* Top Table Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={`/api/admin/export-csv?token=${token}`}
                download
                className="px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </a>

              {reviews.length === 0 && (
                <button
                  onClick={handleSeedDemo}
                  className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Seed Demo Reviews</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search reviews or customer..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            </div>

            {/* Rating Filter */}
            <select
              value={ratingFilter}
              onChange={e => setRatingFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
            >
              <option value="all">All Ratings (1-10)</option>
              <option value="high">Positive (8-10 Stars)</option>
              <option value="mid">Neutral (5-7 Stars)</option>
              <option value="low">Critical (1-4 Stars)</option>
              <option value="10">10 Stars Only</option>
              <option value="9">9 Stars Only</option>
              <option value="8">8 Stars Only</option>
              <option value="7">7 Stars Only</option>
              <option value="6">6 Stars Only</option>
              <option value="5">5 Stars Only</option>
              <option value="4">4 Stars Only</option>
              <option value="3">3 Stars Only</option>
              <option value="2">2 Stars Only</option>
              <option value="1">1 Star Only</option>
            </select>

            {/* Source Filter */}
            <select
              value={sourceFilter}
              onChange={e => setSourceFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
            >
              <option value="all">All Sources</option>
              <option value="nfc">NFC Card Tap</option>
              <option value="qr">QR Code Scan</option>
              <option value="direct">Direct Link</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-3 py-2 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="highest">Sort: Highest Rating</option>
              <option value="lowest">Sort: Lowest Rating</option>
            </select>
          </div>

          {/* Table Content */}
          <div className="pt-2">
            {isLoading ? (
              <div className="py-16 text-center text-xs text-neutral-400">
                Loading database records...
              </div>
            ) : filteredReviews.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
                  <Star className="w-6 h-6 stroke-[1.5]" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-neutral-800">No reviews found</h4>
                  <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                    {reviews.length === 0
                      ? 'No reviews have been submitted yet. Test by submitting one in the customer review view or seed demo data.'
                      : 'No reviews match your current filters. Try resetting the search or filter options.'}
                  </p>
                </div>
                {reviews.length === 0 && (
                  <button
                    onClick={handleSeedDemo}
                    className="px-4 py-2 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 transition-colors"
                  >
                    Seed 5 Demo Reviews
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {filteredReviews.map(r => {
                  let ratingBadgeColor = 'bg-amber-100 text-amber-900 border-amber-200';
                  if (r.rating <= 4) ratingBadgeColor = 'bg-rose-100 text-rose-900 border-rose-200';
                  else if (r.rating <= 7) ratingBadgeColor = 'bg-yellow-100 text-yellow-900 border-yellow-200';

                  return (
                    <div
                      key={r.id}
                      className="py-4 hover:bg-neutral-50/70 transition-colors rounded-xl px-2.5 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                    >
                      {/* Left: Star score & review text */}
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-xs font-black border flex items-center gap-1 ${ratingBadgeColor}`}
                          >
                            <Star className="w-3 h-3 fill-current" />
                            <span>{r.rating}/10</span>
                          </span>

                          <span className="text-xs font-bold text-neutral-800">
                            {r.customerName || 'Anonymous Customer'}
                          </span>

                          <span className="text-[11px] text-neutral-400">
                            {new Date(r.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>

                          {/* Source badge */}
                          <span className="text-[10px] font-semibold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full uppercase">
                            {r.source}
                          </span>

                          {r.aiAssisted && (
                            <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" />
                              AI Assisted
                            </span>
                          )}
                        </div>

                        {/* Review text */}
                        <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed max-w-3xl">
                          "{r.reviewText}"
                        </p>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1.5 shrink-0 sm:self-center">
                        <button
                          onClick={() => handleCopyReview(r.reviewText, r.id)}
                          className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                          title="Copy review text"
                        >
                          {copiedReviewId === r.id ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>

                        <button
                          onClick={() => setSelectedReview(r)}
                          className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                          title="View complete details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setDeleteCandidate(r)}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                          title="Delete review"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Review Detail Modal */}
      <AnimatePresence>
        {selectedReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReview(null)}
              className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden z-10 p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-amber-600">
                    ★ {selectedReview.rating} / 10
                  </span>
                  <span className="text-neutral-300">·</span>
                  <span className="text-xs font-semibold text-neutral-800">
                    {selectedReview.customerName || 'Anonymous Customer'}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedReview(null)}
                  className="text-neutral-400 hover:text-neutral-700 text-xs font-semibold"
                >
                  Close
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  Full Customer Feedback Text
                </label>
                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 text-sm text-neutral-800 leading-relaxed italic">
                  "{selectedReview.reviewText}"
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-neutral-50/70 p-3 rounded-xl border border-neutral-200/80">
                <div>
                  <span className="text-neutral-400 block text-[10px]">TIMESTAMP</span>
                  <span className="font-medium text-neutral-700">
                    {new Date(selectedReview.createdAt).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[10px]">SUBMISSION SOURCE</span>
                  <span className="font-semibold text-neutral-700 uppercase">
                    {selectedReview.source}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[10px]">AI-ASSISTED</span>
                  <span className="font-medium text-neutral-700">
                    {selectedReview.aiAssisted ? 'Yes (Drafted with AI)' : 'No (Customer Written)'}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[10px]">DATABASE RECORD ID</span>
                  <span className="font-mono text-[10px] text-neutral-500 truncate block">
                    {selectedReview.id}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => handleCopyReview(selectedReview.reviewText, selectedReview.id)}
                  className="px-3 py-2 rounded-xl border border-neutral-200 text-xs font-semibold hover:bg-neutral-50 flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Text</span>
                </button>

                <button
                  onClick={() => {
                    setDeleteCandidate(selectedReview);
                  }}
                  className="px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Record</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteCandidate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteCandidate(null)}
              className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden z-10 p-6 space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-600">
                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-neutral-900">Delete Review Record?</h4>
                  <p className="text-xs text-neutral-500">This action cannot be undone.</p>
                </div>
              </div>

              <p className="text-xs text-neutral-600 bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                "{deleteCandidate.reviewText.slice(0, 100)}..."
              </p>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  onClick={() => setDeleteCandidate(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeleting ? 'Deleting...' : 'Confirm Delete'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <BusinessSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={business}
        token={token}
        onConfigUpdated={updated => {
          onBusinessUpdated(updated);
          loadData(true);
        }}
      />

      {/* QR / NFC Modal */}
      <QrNfcModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        business={business}
      />

      {/* Google Search Suggestion & Discovery Simulator */}
      <GoogleSearchSimulator
        isOpen={isSearchSimulatorOpen}
        onClose={() => setIsSearchSimulatorOpen(false)}
        business={business}
        latestReview={reviews[0]}
      />
    </div>
  );
};
