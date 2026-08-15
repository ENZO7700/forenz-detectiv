import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LiquidGlassTooltip({
  content,
  children,
  position = 'top', // 'top' | 'bottom' | 'left' | 'right'
  className = ''
}) {
  const [visible, setVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  }[position] || 'bottom-full left-1/2 -translate-x-1/2 mb-2';

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      <AnimatePresence>
        {visible && content && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: position === 'top' ? 4 : position === 'bottom' ? -4 : 0 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 px-2.5 py-1 text-xs font-medium text-slate-800 dark:text-slate-200 bg-white/80 dark:bg-slate-800/85 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-xl shadow-glass whitespace-nowrap pointer-events-none ${positionClasses} ${className}`}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
