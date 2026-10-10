import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  RotateCcw,
  Send,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  Building2,
  AlertCircle,
  HelpCircle,
  Info,
  Search,
} from 'lucide-react';
import { AskMateLogo } from './AskMateLogo';
import { StarRating10 } from './StarRating10';
import { GoogleCloudFormModal } from './GoogleCloudFormModal';
import { GoogleSearchSimulator } from './GoogleSearchSimulator';
import { BusinessConfig, Review, ReviewSource } from '../types';
import { api } from '../api';

interface CustomerReviewPageProps {
  business: BusinessConfig;
  onOpenAdminLogin: () => void;
}

export const CustomerReviewPage: React.FC<CustomerReviewPageProps> = ({
  business,
  onOpenAdminLogin,
}) => {
  const [rating, setRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [isAiPowered, setIsAiPowered] = useState<boolean>(true);
  const [isTypingAnimation, setIsTypingAnimation] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [submittedReviewText, setSubmittedReviewText] = useState<string>('');
  const [submittedReview, setSubmittedReview] = useState<Review | null>(null);
  const [isGoogleFormModalOpen, setIsGoogleFormModalOpen] = useState<boolean>(false);
  const [isSearchSimulatorOpen, setIsSearchSimulatorOpen] = useState<boolean>(false);
  const [copiedReviewText, setCopiedReviewText] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [source, setSource] = useState<ReviewSource>('direct');
  const [optionalContext, setOptionalContext] = useState<string>('');

  const typewriterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Detect submission source from query params (e.g. ?source=nfc or ?source=qr)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const src = params.get('source');
    if (src === 'nfc') setSource('nfc');
    else if (src === 'qr') setSource('qr');
    else if (src === 'link') setSource('link');
    else setSource('direct');
  }, []);

  // Smooth typewriter animation effect
  const runTypewriter = (text: string) => {
    if (typewriterTimeoutRef.current) {
      clearTimeout(typewriterTimeoutRef.current);
    }
    setReviewText('');
    setIsTypingAnimation(true);

    let currentIndex = 0;
    const speed = 18; // ms per char

    const typeNext = () => {
      if (currentIndex <= text.length) {
        setReviewText(text.slice(0, currentIndex));
        currentIndex++;
        typewriterTimeoutRef.current = setTimeout(typeNext, speed);
      } else {
        setIsTypingAnimation(false);
      }
    };

    typeNext();
  };

  const stopTypewriter = (fullText?: string) => {
    if (typewriterTimeoutRef.current) {
      clearTimeout(typewriterTimeoutRef.current);
      typewriterTimeoutRef.current = null;
    }
    setIsTypingAnimation(false);
    if (fullText) {
      setReviewText(fullText);
    }
  };

  // Automatically fetch AI review suggestion when rating changes
  const handleRatingChange = async (newRating: number) => {
    setRating(newRating);
    setErrorMessage(null);
    fetchSuggestion(newRating);
  };

  const fetchSuggestion = async (selectedRating: number, context?: string) => {
    if (selectedRating === 0) return;
    setIsAiGenerating(true);
    stopTypewriter();

    try {
      const response = await api.generateSuggestion(selectedRating, context || optionalContext);
      setIsAiPowered(response.aiPowered);
      runTypewriter(response.suggestion);
    } catch (err) {
      console.warn('Suggestion generator error, falling back to manual entry:', err);
      setIsAiPowered(false);
      setReviewText(
        selectedRating >= 8
          ? 'Had a wonderful visit! Great hospitality, high standards, and a welcoming atmosphere. Highly recommend.'
          : selectedRating >= 5
          ? 'Decent experience overall. Good service, with a few small areas that could be improved for next time.'
          : 'My experience today fell below expectations. I hope the team can address the delays and service consistency.'
      );
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleRegenerate = () => {
    if (rating === 0) return;
    fetchSuggestion(rating);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (rating === 0) {
      setErrorMessage('Please select a rating between 1 and 10 stars.');
      return;
    }

    if (!reviewText.trim() || reviewText.trim().length < 5) {
      setErrorMessage('Please write at least a short sentence (5 characters or more) before submitting.');
      return;
    }

    setIsSubmitting(true);
    stopTypewriter(reviewText);

    try {
      const result = await api.submitReview({
        rating,
        reviewText: reviewText.trim(),
        customerName: customerName.trim() || undefined,
        source,
        aiAssisted: isAiPowered,
      });

      setSubmittedReview(result.review);
      setSubmittedReviewText(reviewText.trim());
      setSubmitSuccess(true);

      // Trigger celebration confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899'],
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit review. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyReviewText = () => {
    navigator.clipboard.writeText(submittedReviewText);
    setCopiedReviewText(true);
    setTimeout(() => setCopiedReviewText(false), 2500);
  };

  const handleResetForNewReview = () => {
    setRating(0);
    setReviewText('');
    setCustomerName('');
    setOptionalContext('');
    setSubmitSuccess(false);
    setSubmittedReviewText('');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-transparent text-neutral-900">
      {/* Top Banner / Subtle Header */}
      <header className="w-full pt-8 pb-4 px-4 sm:px-6 flex flex-col items-center border-b border-neutral-200/50 bg-white/60 backdrop-blur-lg sticky top-0 z-20 shadow-xs">
        <div className="w-full max-w-xl flex flex-col items-center">
          {/* ASKMATE Prominent Brand Logo with LEARN | EASY */}
          <AskMateLogo size="lg" showTagline={true} />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-xl mx-auto px-4 py-6 sm:py-8">
        <AnimatePresence mode="wait">
          {!submitSuccess ? (
            <motion.div
              key="review-form"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Welcome Card */}
              <div className="text-center space-y-1.5 px-4 py-3 rounded-2xl bg-white/60 backdrop-blur-md border border-white/60 shadow-xs">
                <p className="text-[11px] font-bold text-amber-600 uppercase tracking-widest">
                  Assignment Feedback & Review
                </p>
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-neutral-900 tracking-tight">
                  How was your assignment experience?
                </h1>
                <p className="text-xs sm:text-sm text-neutral-600 max-w-md mx-auto leading-relaxed">
                  Rate your recent assignment order, turnaround speed, and delivery quality. Your feedback helps us keep learning easy and effective!
                </p>
              </div>

              {/* 10-Star Rating Component */}
              <div className="py-2">
                <StarRating10
                  value={rating}
                  onChange={handleRatingChange}
                  disabled={isSubmitting}
                />
              </div>

              {/* Error Message if Any */}
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{errorMessage}</p>
                </motion.div>
              )}

              {/* AI-Assisted Review Section (Visible once a rating is picked) */}
              {rating > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.4 }}
                  className="space-y-4"
                >
                  {/* AI Generator Header & Status */}
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-semibold text-neutral-800">
                        {isAiPowered ? 'AI-Assisted Suggestion' : 'Smart Suggestion Template'}
                      </span>
                      <span className="text-[11px] text-neutral-400">
                        · Fully editable
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleRegenerate}
                      disabled={isAiGenerating || isSubmitting}
                      className="text-xs font-medium text-neutral-600 hover:text-neutral-900 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-neutral-100 transition-colors disabled:opacity-50"
                      title="Generate a different suggestion"
                    >
                      <RotateCcw className={`w-3 h-3 ${isAiGenerating ? 'animate-spin' : ''}`} />
                      <span>{isAiGenerating ? 'Drafting...' : 'Regenerate'}</span>
                    </button>
                  </div>

                  {/* Form Container */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Textarea for review message */}
                    <div className="relative rounded-2xl bg-white border border-neutral-200/90 shadow-sm focus-within:ring-2 focus-within:ring-amber-500/20 focus-within:border-amber-500 transition-all overflow-hidden">
                      <textarea
                        ref={textareaRef}
                        rows={4}
                        value={reviewText}
                        onChange={e => {
                          stopTypewriter();
                          setReviewText(e.target.value);
                        }}
                        onFocus={() => {
                          if (isTypingAnimation) stopTypewriter();
                        }}
                        placeholder="Type or customize your feedback here..."
                        className="w-full p-3.5 sm:p-4 text-sm text-neutral-800 placeholder-neutral-400 resize-none focus:outline-none bg-transparent leading-relaxed"
                        required
                        disabled={isSubmitting}
                      />

                      {/* Character Count & Typing indicator */}
                      <div className="px-3.5 pb-2.5 pt-1 flex items-center justify-between text-[11px] text-neutral-400 border-t border-neutral-100 bg-neutral-50/50">
                        <div className="flex items-center gap-1.5">
                          {isTypingAnimation ? (
                            <span className="flex items-center gap-1 text-amber-600 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Generating text... Tap to edit
                            </span>
                          ) : (
                            <span>You can edit or replace any part of this review</span>
                          )}
                        </div>
                        <span className="tabular-nums font-mono text-neutral-400">
                          {reviewText.length} chars
                        </span>
                      </div>
                    </div>

                    {/* Customer Name (Optional) */}
                    <div className="space-y-1">
                      <label
                        htmlFor="customerName"
                        className="block text-xs font-semibold text-neutral-700 px-1"
                      >
                        Your Name <span className="text-neutral-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        id="customerName"
                        type="text"
                        maxLength={60}
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        placeholder="e.g. Alex M. or leave blank to stay anonymous"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-neutral-200/90 text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-sm"
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Submit Button */}
                    <motion.button
                      type="submit"
                      disabled={isSubmitting || !reviewText.trim()}
                      whileTap={{ scale: 0.98 }}
                      className="w-full h-12 rounded-xl bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-950 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md shadow-neutral-900/10 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                    >
                      {isSubmitting ? (
                        <>
                          <RotateCcw className="w-4 h-4 animate-spin" />
                          <span>Submitting Review...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Submit Assignment Review</span>
                        </>
                      )}
                    </motion.button>
                  </form>
                </motion.div>
              )}

              {/* Privacy Notice */}
              <div className="pt-2 pb-4 text-center">
                <div className="inline-flex items-center gap-1.5 text-[11px] text-neutral-500 bg-neutral-100/80 px-3 py-1.5 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5 text-neutral-600" />
                  <span>Student privacy protected. We never collect passwords, student IDs, or share assignment data.</span>
                </div>
              </div>
            </motion.div>
          ) : (
            /* SUBMISSION CONFIRMATION STATE */
            <motion.div
              key="success-screen"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="space-y-6 text-center py-4"
            >
              {/* Success Badge */}
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-neutral-900">
                  Thank you for your feedback!
                </h2>
                <p className="text-sm text-neutral-600 max-w-md mx-auto">
                  Your <strong className="text-neutral-900">{rating}/10</strong> assignment review has been saved securely to the ASKMATE platform.
                </p>
              </div>

              {/* Submitted Review Snapshot Card */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 text-left shadow-sm space-y-3">
                <div className="flex items-center justify-between text-xs text-neutral-500 border-b border-neutral-100 pb-2.5">
                  <span className="font-semibold text-amber-600 flex items-center gap-1">
                    ★ {rating} / 10 Star Rating
                  </span>
                  <span>{customerName || 'Anonymous Customer'}</span>
                </div>
                <p className="text-xs sm:text-sm text-neutral-700 italic leading-relaxed">
                  "{submittedReviewText}"
                </p>

                {/* Quick Copy Action */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleCopyReviewText}
                    className="text-xs font-medium text-neutral-600 hover:text-neutral-900 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/70 transition-colors"
                  >
                    {copiedReviewText ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-semibold">Copied to clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy review text</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Google Reviews & Google Form Cloud Sync Card */}
              {(() => {
                const rawUrl = business.googleReviewUrl?.trim();
                const resolvedUrl =
                  rawUrl && !rawUrl.includes('placeid=example') && rawUrl.startsWith('http')
                    ? rawUrl
                    : `https://www.google.com/search?q=${encodeURIComponent('ASKMATE assignment ordering reviews')}`;

                return (
                  <div className="bg-gradient-to-br from-amber-50/60 via-purple-50/40 to-neutral-50 rounded-2xl p-4 sm:p-5 border border-amber-200/80 text-left space-y-3.5 shadow-xs">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white border border-neutral-200 flex items-center justify-center shrink-0 shadow-xs font-bold text-neutral-700 text-xs">
                        G
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-bold text-neutral-900">
                          Google Cloud Data & Form Sync
                        </h4>
                        <p className="text-xs text-neutral-600 leading-relaxed">
                          Your review can be automatically synced to Google Form & Google Cloud data, ensuring ASKMATE surfaces when students search online.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-1">
                      {/* 1. Open Google Form with Auto-Pasted Text */}
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(submittedReviewText);
                          setCopiedReviewText(true);
                          setIsGoogleFormModalOpen(true);
                        }}
                        className="w-full h-11 rounded-xl bg-[#673ab7] hover:bg-[#5e35b1] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
                      >
                        <span>Open Google Form (Auto-Filled & Cloud Sync)</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>

                      {/* 2. Suggest when searching about ASKMATE preview */}
                      <button
                        type="button"
                        onClick={() => setIsSearchSimulatorOpen(true)}
                        className="w-full h-10 rounded-xl bg-white hover:bg-neutral-50 text-blue-700 border border-blue-200 font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-2xs"
                      >
                        <Search className="w-3.5 h-3.5 text-blue-600" />
                        <span>See How Google Suggests ASKMATE Reviews</span>
                      </button>

                      {/* 3. Direct Google Reviews Link */}
                      <a
                        href={resolvedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          navigator.clipboard.writeText(submittedReviewText);
                          setCopiedReviewText(true);
                        }}
                        className="w-full h-9 rounded-xl bg-neutral-100/80 hover:bg-neutral-200/80 text-neutral-700 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <span>Continue to Google Search Reviews</span>
                        <ExternalLink className="w-3 h-3 text-neutral-500" />
                      </a>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1 border-t border-neutral-200/60">
                      <span>Google Cloud Sync: Firestore Active</span>
                      <span>10-Star Scale</span>
                    </div>
                  </div>
                );
              })()}

              {/* Reset Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleResetForNewReview}
                  className="text-xs font-medium text-neutral-500 hover:text-neutral-800 underline underline-offset-4 transition-colors"
                >
                  Submit another review
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer with Discreet Admin Link */}
      <footer className="w-full py-5 px-4 text-center border-t border-neutral-200/60 bg-white/50 text-neutral-500 text-xs">
        <div className="max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[11px]">
            <span className="font-semibold text-neutral-700">ASKMATE</span>
            <span>·</span>
            <span>Customer Review Experience</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onOpenAdminLogin}
              className="text-neutral-500 hover:text-neutral-900 font-medium transition-colors text-xs flex items-center gap-1 focus:outline-none"
            >
              <span>Admin Login</span>
            </button>
          </div>
        </div>
      </footer>
      {/* Modals for Google Form Cloud Sync & Google Search Discovery Simulator */}
      {submittedReview && (
        <GoogleCloudFormModal
          isOpen={isGoogleFormModalOpen}
          onClose={() => setIsGoogleFormModalOpen(false)}
          review={submittedReview}
          business={business}
        />
      )}

      <GoogleSearchSimulator
        isOpen={isSearchSimulatorOpen}
        onClose={() => setIsSearchSimulatorOpen(false)}
        business={business}
        latestReview={submittedReview || undefined}
      />
    </div>
  );
};
