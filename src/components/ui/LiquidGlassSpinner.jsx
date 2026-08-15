import React from 'react';

export default function LiquidGlassSpinner({
  size = 'md', // 'sm' | 'md' | 'lg'
  label = null,
  className = ''
}) {
  const sizeMap = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-[3px]'
  }[size] || 'w-6 h-6 border-2';

  return (
    <div className={`inline-flex items-center gap-2.5 justify-center ${className}`}>
      <div className={`relative ${sizeMap} rounded-full border-blue-600/25 border-t-blue-600 dark:border-blue-400/25 dark:border-t-blue-400 animate-spin`}>
        <div className="absolute inset-0 rounded-full blur-[2px] bg-blue-500/10 pointer-events-none" />
      </div>
      {label && <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">{label}</span>}
    </div>
  );
}
