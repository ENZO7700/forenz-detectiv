import React from 'react';
import { motion } from 'framer-motion';

export default function LiquidGlassButton({
  children,
  variant = 'default', // 'default' | 'primary' | 'destructive' | 'ghost' | 'glass'
  size = 'md', // 'sm' | 'md' | 'lg' | 'icon'
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  icon: Icon,
  ...props
}) {
  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-xs rounded-xl gap-1.5',
    md: 'px-3.5 py-2 text-sm rounded-2xl gap-2',
    lg: 'px-5 py-2.5 text-base rounded-2xl gap-2.5',
    icon: 'w-9 h-9 p-0 rounded-2xl items-center justify-center'
  }[size] || 'px-3.5 py-2 text-sm rounded-2xl gap-2';

  const variantClasses = {
    primary: 'liquid-glass-btn-primary',
    destructive: 'liquid-glass-btn-red',
    ghost: 'liquid-glass-btn-ghost',
    glass: 'bg-white/40 dark:bg-slate-800/40 text-slate-800 dark:text-slate-100 border border-white/60 dark:border-white/10 hover:bg-white/75 dark:hover:bg-slate-700 shadow-glass-sm',
    default: 'bg-gradient-to-r from-blue-600/10 via-white/50 to-red-600/10 dark:from-blue-600/20 dark:via-slate-800/50 dark:to-red-600/20 text-slate-800 dark:text-slate-100 border border-blue-200/50 dark:border-white/10 hover:bg-white/80 dark:hover:bg-slate-700 shadow-glass-sm'
  }[variant] || 'liquid-glass-btn-ghost';

  return (
    <motion.button
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`liquid-glass-btn font-medium inline-flex items-center select-none disabled:opacity-50 disabled:pointer-events-none ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
      {children}
    </motion.button>
  );
}
