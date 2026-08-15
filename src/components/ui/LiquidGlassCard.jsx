import React from 'react';
import { motion } from 'framer-motion';

export default function LiquidGlassCard({
  children,
  className = '',
  hoverEffect = true,
  glow = null, // 'blue' | 'red' | 'gold' | null
  ...props
}) {
  const glowClasses = {
    blue: 'hover:shadow-glow-blue hover:border-blue-400/40',
    red: 'hover:shadow-glow-red hover:border-red-400/40',
    gold: 'hover:shadow-glow-gold hover:border-amber-400/40'
  }[glow] || '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`liquid-glass-card rounded-3xl p-4 sm:p-5 relative overflow-hidden ${hoverEffect ? 'hover:-translate-y-0.5' : ''} ${glowClasses} ${className}`}
      {...props}
    >
      {/* Subtílny horný lesk (reflection line) */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/60 dark:via-white/20 to-transparent pointer-events-none" />
      {children}
    </motion.div>
  );
}
