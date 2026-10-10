import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Star,
  Globe,
  ExternalLink,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Database,
  Building2,
} from 'lucide-react';
import { BusinessConfig, Review } from '../types';

interface GoogleSearchSimulatorProps {
  business: BusinessConfig;
  latestReview?: Review;
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleSearchSimulator: React.FC<GoogleSearchSimulatorProps> = ({
  business,
  latestReview,
  isOpen,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('askmate reviews');
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);

  if (!isOpen) return null;

  const suggestions = [
    {
      query: 'askmate reviews',
      tag: '⭐ 9.8/10 Rating (Verified Students)',
      desc: 'Authentic student feedback on assignment orders',
    },
    {
      query: 'askmate learn easy',
      tag: '📚 Official Tagline',
      desc: 'Fast coursework delivery & step-by-step help',
    },
    {
      query: 'askmate assignment ordering tool',
      tag: '⚡ 10-Star Scale',
      desc: 'On-time delivery, plagiarism-free solutions',
    },
    {
      query: 'askmate google form feedback',
      tag: '☁️ Google Cloud Data',
      desc: 'Direct cloud synced ratings & student testimonials',
    },
  ];

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

        {/* Modal Window simulating Google Search Interface */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden z-10 flex flex-col max-h-[90vh]"
        >
          {/* Google Search Style Header */}
          <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center justify-between gap-3 bg-neutral-50/60">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg font-display tracking-tight text-neutral-800 flex items-center">
                <span className="text-[#4285F4]">G</span>
                <span className="text-[#EA4335]">o</span>
                <span className="text-[#FBBC05]">o</span>
                <span className="text-[#4285F4]">g</span>
                <span className="text-[#34A853]">l</span>
                <span className="text-[#EA4335]">e</span>
                <span className="text-neutral-400 font-sans text-xs ml-2 font-normal">
                  Search Discovery Preview
                </span>
              </span>
            </div>

            <button
              onClick={onClose}
              className="text-xs font-semibold text-neutral-500 hover:text-neutral-800 px-2 py-1 rounded-md hover:bg-neutral-100"
            >
              Close
            </button>
          </div>

          {/* Interactive Search Bar */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
            <div className="space-y-2">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setSelectedSuggestion(null);
                  }}
                  placeholder="Search about ASKMATE..."
                  className="w-full pl-11 pr-4 py-3 rounded-full border border-neutral-300 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-neutral-900"
                />
                <Search className="w-5 h-5 text-neutral-400 absolute left-4 top-3.5" />
              </div>

              {/* Google Autocomplete Suggestions Dropdown */}
              <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden divide-y divide-neutral-100">
                <div className="px-3.5 py-2 bg-neutral-50 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Google Autocomplete Suggestions</span>
                  <span className="text-emerald-700 flex items-center gap-1 font-bold">
                    <Sparkles className="w-3 h-3" /> Live Ranked
                  </span>
                </div>
                {suggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSearchQuery(item.query);
                      setSelectedSuggestion(item.query);
                    }}
                    className="w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-blue-50/60 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Search className="w-4 h-4 text-neutral-400 group-hover:text-blue-600 transition-colors" />
                      <div>
                        <span className="text-xs sm:text-sm font-semibold text-neutral-800 group-hover:text-blue-900">
                          {item.query}
                        </span>
                        <span className="hidden sm:inline text-xs text-neutral-400 ml-2">
                          — {item.desc}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full group-hover:bg-blue-100 group-hover:text-blue-800">
                      {item.tag}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Google Search Result Card (Rich Snippet) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-xs text-neutral-600 font-mono">
                  <Globe className="w-3.5 h-3.5 text-neutral-400" />
                  <span>https://askmatereview.com › reviews</span>
                </div>
                <h4 className="text-base sm:text-lg font-bold text-[#1a0dab] hover:underline cursor-pointer">
                  ASKMATE — Assignment Ordering Platform | LEARN | EASY
                </h4>
              </div>

              {/* Rich Star Snippet */}
              <div className="flex items-center gap-2 text-xs text-neutral-600">
                <div className="flex items-center gap-0.5 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <span className="font-bold text-neutral-800 tabular-nums">Rating: 9.8 / 10</span>
                <span>·</span>
                <span className="text-neutral-500">Verified Student Reviews</span>
                <span>·</span>
                <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  Google Cloud Synced
                </span>
              </div>

              {/* Snippet Description */}
              <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed">
                Order your academic assignments with ease on ASKMATE. Fast turnaround, step-by-step solutions, and transparent 10-star student feedback. Tagline: <strong>LEARN | EASY</strong>.
              </p>

              {/* Latest Review Feature Snippet */}
              {latestReview && (
                <div className="mt-2 p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-800 italic leading-relaxed">
                  <span className="font-semibold not-italic text-neutral-900 block mb-0.5">
                    Latest Student Review ({latestReview.rating}/10):
                  </span>
                  "{latestReview.reviewText}"
                </div>
              )}
            </div>

            {/* Google Knowledge Panel Card */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-neutral-50 to-neutral-100/70 border border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-neutral-900">ASKMATE Knowledge Panel</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-xs text-neutral-600">
                  Public search presence is updated automatically when customers submit reviews and sync to Google Cloud Data.
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-700 bg-white px-3 py-1.5 rounded-lg border border-neutral-200 shadow-xs">
                  LEARN | EASY
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
