import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Star } from 'lucide-react';

interface StarRating10Props {
  value: number; // 0 if unselected, 1-10
  onChange: (val: number) => void;
  disabled?: boolean;
}

const RATING_LABELS: Record<number, { title: string; color: string; desc: string }> = {
  1: { title: '1/10', color: 'text-rose-600', desc: 'Needs Urgent Improvement' },
  2: { title: '2/10', color: 'text-rose-600', desc: 'Well Below Expectations' },
  3: { title: '3/10', color: 'text-amber-600', desc: 'Noticeable Shortcomings' },
  4: { title: '4/10', color: 'text-amber-600', desc: 'Below Average' },
  5: { title: '5/10', color: 'text-yellow-600', desc: 'Fair / Satisfactory' },
  6: { title: '6/10', color: 'text-yellow-600', desc: 'Pleasant & Decent' },
  7: { title: '7/10', color: 'text-emerald-600', desc: 'Good Quality Experience' },
  8: { title: '8/10', color: 'text-emerald-600', desc: 'Great & Highly Recommended' },
  9: { title: '9/10', color: 'text-emerald-600', desc: 'Wonderful & Impressive' },
  10: { title: '10/10', color: 'text-amber-500', desc: 'Flawless & Exceptional!' },
};

export const StarRating10: React.FC<StarRating10Props> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);

  const displayScore = hoveredStar !== null ? hoveredStar : value;
  const currentMeta = displayScore > 0 ? RATING_LABELS[displayScore] : null;

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (disabled) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(10, (value || 0) + 1);
      onChange(next);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      const prev = Math.max(1, (value || 2) - 1);
      onChange(prev);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange(index);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* 10-Star Horizontal Strip */}
      <div
        className="w-full max-w-sm sm:max-w-md bg-white rounded-2xl p-2.5 sm:p-3.5 border border-neutral-200/80 shadow-sm flex items-center justify-between gap-1 sm:gap-1.5 touch-manipulation select-none"
        role="radiogroup"
        aria-label="10-star rating selector"
        onMouseLeave={() => setHoveredStar(null)}
      >
        {Array.from({ length: 10 }, (_, i) => i + 1).map(starNum => {
          const isFilled = starNum <= displayScore;
          const isSelected = starNum === value;

          return (
            <motion.button
              key={starNum}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`Rate ${starNum} out of 10 stars`}
              tabIndex={starNum === (value || 1) ? 0 : -1}
              disabled={disabled}
              onClick={() => onChange(starNum)}
              onMouseEnter={() => setHoveredStar(starNum)}
              onFocus={() => setHoveredStar(starNum)}
              onBlur={() => setHoveredStar(null)}
              onKeyDown={e => handleKeyDown(e, starNum)}
              whileHover={{ scale: disabled ? 1 : 1.22 }}
              whileTap={{ scale: disabled ? 1 : 0.9 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              className={`relative flex-1 min-w-[28px] max-w-[38px] aspect-square flex flex-col items-center justify-center rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                isFilled
                  ? 'text-amber-400'
                  : 'text-neutral-300 hover:text-neutral-400'
              } ${isSelected ? 'bg-amber-50/80' : 'hover:bg-neutral-50'}`}
            >
              <Star
                className={`w-5 h-5 sm:w-6 sm:h-6 transition-all duration-150 ${
                  isFilled ? 'fill-amber-400 filter drop-shadow-[0_1px_3px_rgba(251,191,36,0.4)]' : 'stroke-[1.5]'
                }`}
              />
              <span className="text-[9px] font-bold tracking-tight text-neutral-400 mt-0.5">
                {starNum}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Dynamic Feedback Label */}
      <div className="min-h-[3rem] flex flex-col items-center justify-center text-center mt-2.5">
        {currentMeta ? (
          <motion.div
            key={displayScore}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center"
          >
            <div className="flex items-center gap-2">
              <span className={`font-display font-extrabold text-lg sm:text-xl ${currentMeta.color} tabular-nums`}>
                {currentMeta.title}
              </span>
              <span className="text-neutral-300 font-light">/</span>
              <span className="text-sm sm:text-base font-semibold text-neutral-800">
                {currentMeta.desc}
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Tap any star to adjust your rating
            </p>
          </motion.div>
        ) : (
          <p className="text-sm font-medium text-neutral-500 animate-pulse">
            Select a star from 1 to 10 to begin your review
          </p>
        )}
      </div>
    </div>
  );
};
