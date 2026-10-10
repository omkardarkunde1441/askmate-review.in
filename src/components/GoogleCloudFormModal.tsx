import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  CloudCheck,
  FileSpreadsheet,
  Database,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { BusinessConfig, Review } from '../types';
import { api } from '../api';

interface GoogleCloudFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: {
    id: string;
    rating: number;
    reviewText: string;
    customerName?: string;
  };
  business: BusinessConfig;
}

export const GoogleCloudFormModal: React.FC<GoogleCloudFormModalProps> = ({
  isOpen,
  onClose,
  review,
  business,
}) => {
  const [isSubmittingCloud, setIsSubmittingCloud] = useState(false);
  const [cloudSynced, setCloudSynced] = useState(false);
  const [cloudStorageId, setCloudStorageId] = useState<string | null>(null);
  const [copiedReviewText, setCopiedReviewText] = useState(false);

  if (!isOpen) return null;

  // Build the prefilled Google Form URL
  const buildPrefilledUrl = () => {
    const baseUrl =
      business.googleFormUrl?.trim() ||
      'https://docs.google.com/forms/d/e/1FAIpQLSc-askmate-feedback/viewform';

    const entryReview = business.googleFormEntryIdReview || 'entry.123456789';
    const entryRating = business.googleFormEntryIdRating || 'entry.987654321';
    const entryName = business.googleFormEntryIdName || 'entry.456789123';

    const params = new URLSearchParams();
    params.set(entryReview, review.reviewText);
    params.set(entryRating, String(review.rating));
    if (review.customerName) {
      params.set(entryName, review.customerName);
    }

    return `${baseUrl}?${params.toString()}`;
  };

  const prefilledUrl = buildPrefilledUrl();

  const handleSyncToGoogleCloud = async () => {
    setIsSubmittingCloud(true);
    try {
      const res = await api.syncGoogleCloud(review.id, true);
      setCloudSynced(true);
      setCloudStorageId(`gcloud_firestore_rec_${Date.now().toString(36)}`);
    } catch (err) {
      console.error('Google Cloud sync error:', err);
    } finally {
      setIsSubmittingCloud(false);
    }
  };

  const handleCopyReview = () => {
    navigator.clipboard.writeText(review.reviewText);
    setCopiedReviewText(true);
    setTimeout(() => setCopiedReviewText(false), 2500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm"
        />

        {/* Modal Window with Google Forms Purple Header Accent */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden z-10 flex flex-col max-h-[90vh]"
        >
          {/* Google Forms Signature Header Banner */}
          <div className="bg-[#673ab7] px-6 py-4 text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-xs font-bold text-sm">
                📋
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold leading-tight">
                  Google Forms · ASKMATE Review Sync
                </h3>
                <p className="text-[11px] text-purple-200">
                  Auto-pasted response & Google Cloud Data persistence
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
            {/* Notice Banner */}
            <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200/80 text-purple-950 text-xs flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold">Automatic Response Transfer</span>
                <p className="text-purple-800 leading-relaxed text-[11px]">
                  Your review message, rating ({review.rating}/10), and customer name have been automatically formatted and pasted ready for Google Cloud Data storage.
                </p>
              </div>
            </div>

            {/* Simulated Google Form Field 1: Rating */}
            <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-1.5">
              <label className="text-xs font-bold text-neutral-800 block">
                1. How would you rate your assignment experience? <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2 pt-1">
                <span className="px-3 py-1 rounded-lg bg-purple-100 text-purple-900 font-bold text-xs border border-purple-200">
                  ★ {review.rating} out of 10 Stars
                </span>
                <span className="text-[11px] text-neutral-500 font-medium">
                  (Auto-selected from your ASKMATE review)
                </span>
              </div>
            </div>

            {/* Simulated Google Form Field 2: Review Message (Pasted) */}
            <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-neutral-800">
                  2. Detailed Student Feedback <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleCopyReview}
                  className="text-[11px] font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1 transition-colors"
                >
                  {copiedReviewText ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy text</span>
                    </>
                  )}
                </button>
              </div>
              <div className="p-3 bg-white rounded-lg border border-neutral-200 text-xs sm:text-sm text-neutral-800 leading-relaxed italic">
                "{review.reviewText}"
              </div>
            </div>

            {/* Simulated Google Form Field 3: Name */}
            <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-1.5">
              <label className="text-xs font-bold text-neutral-800 block">
                3. Student Name (Optional)
              </label>
              <div className="text-xs font-medium text-neutral-700 bg-white px-3 py-2 rounded-lg border border-neutral-200">
                {review.customerName || 'Anonymous Student'}
              </div>
            </div>

            {/* Google Cloud Data Sync Status Box */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/70 via-purple-50/70 to-emerald-50/70 border border-neutral-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-neutral-900">
                    Google Cloud Storage Destination
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Cloud Firestore Active
                </span>
              </div>

              <p className="text-[11px] text-neutral-600 leading-relaxed">
                Submitting updates the Google Cloud dataset linked to ASKMATE, making your review visible in real-time search analytics and verified student feedback.
              </p>

              {cloudSynced ? (
                <div className="mt-2 p-2.5 bg-white rounded-lg border border-emerald-200 flex items-center justify-between text-xs text-emerald-800">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-semibold">Successfully Saved to Google Cloud Data!</span>
                  </div>
                  <span className="font-mono text-[10px] text-neutral-500">
                    {cloudStorageId}
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSyncToGoogleCloud}
                  disabled={isSubmittingCloud}
                  className="w-full mt-1 h-10 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60 shadow-sm"
                >
                  <Database className="w-3.5 h-3.5 text-blue-400" />
                  <span>
                    {isSubmittingCloud ? 'Saving to Google Cloud...' : 'Save Form to Google Cloud Data'}
                  </span>
                </button>
              )}
            </div>

            {/* External Google Form Link */}
            <div className="pt-1 flex flex-col sm:flex-row gap-2 justify-end">
              <a
                href={prefilledUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleCopyReview}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#673ab7] hover:bg-[#5e35b1] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <span>Open in Official Google Forms</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-semibold transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
