import React from 'react';
import { motion } from 'motion/react';

interface AskMateLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
}

export const AskMateLogo: React.FC<AskMateLogoProps> = ({
  size = 'lg',
  showTagline = true,
  className = '',
}) => {
  const sizeClasses = {
    sm: {
      text: 'text-xl tracking-tight',
      star: 'w-5 h-5',
      badge: 'text-[9px] px-1.5 py-0.5',
    },
    md: {
      text: 'text-2xl tracking-tight',
      star: 'w-6 h-6',
      badge: 'text-[10px] px-2 py-0.5',
    },
    lg: {
      text: 'text-3xl sm:text-4xl tracking-tight',
      star: 'w-8 h-8 sm:w-9 sm:h-9',
      badge: 'text-xs px-2.5 py-0.5',
    },
    xl: {
      text: 'text-4xl sm:text-5xl tracking-tight',
      star: 'w-10 h-10 sm:w-12 sm:h-12',
      badge: 'text-xs px-3 py-1',
    },
  }[size];

  return (
    <motion.div
      initial={{ opacity: 0, y: -12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`inline-flex flex-col items-center select-none ${className}`}
    >
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Integrated Star & Feedback Emblem */}
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 bg-amber-400/20 rounded-xl blur-md" />
          <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-neutral-900 via-neutral-800 to-neutral-700 flex items-center justify-center shadow-md shadow-neutral-900/10 border border-neutral-700/30">
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 fill-amber-400"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Distinctive four-point star with dialogue tail accent */}
              <path d="M12 2L14.2 9.4L21.6 11.6L14.2 13.8L12 21.2L9.8 13.8L2.4 11.6L9.8 9.4L12 2Z" />
            </svg>
            <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500 border border-neutral-900" />
          </div>
        </div>

        {/* Wordmark */}
        <div className="flex items-baseline font-display">
          <span className={`font-black text-neutral-900 ${sizeClasses.text}`}>
            ASK
          </span>
          <span className={`font-light text-neutral-800 tracking-normal ${sizeClasses.text}`}>
            MATE
          </span>
          <span className="text-amber-500 font-black ml-0.5 text-base sm:text-xl">.</span>
        </div>
      </div>

      {showTagline && (
        <motion.div
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className="mt-1 flex items-center gap-1.5 text-[11px] sm:text-xs font-bold tracking-widest text-neutral-600 uppercase"
        >
          <span>LEARN</span>
          <span className="text-amber-500 font-black">|</span>
          <span>EASY</span>
        </motion.div>
      )}
    </motion.div>
  );
};
