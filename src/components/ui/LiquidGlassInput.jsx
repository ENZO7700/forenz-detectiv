import React from 'react';

export default function LiquidGlassInput({
  value,
  onChange,
  placeholder = '',
  icon: Icon,
  type = 'text',
  className = '',
  disabled = false,
  ...props
}) {
  return (
    <div className="relative flex items-center w-full">
      {Icon && (
        <div className="absolute left-3.5 pointer-events-none text-slate-400 dark:text-slate-500">
          <Icon className="w-4 h-4" />
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`liquid-glass-input w-full text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:opacity-50 ${Icon ? 'pl-10' : 'pl-3.5'} ${className}`}
        {...props}
      />
    </div>
  );
}
