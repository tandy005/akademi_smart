'use client';

import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'maroon' | 'red' | 'gold' | 'green' | 'blue' | 'slate';
  size?: 'sm' | 'md';
  dot?: boolean;
  pulse?: boolean;
  className?: string;
}

export default function Badge({
  children,
  variant = 'gold',
  size = 'sm',
  dot = false,
  pulse = false,
  className = '',
}: BadgeProps) {
  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  }[size];

  const variantClasses = {
    maroon: 'bg-red-50 text-red-700 border-red-200',
    red: 'bg-rose-50 text-rose-700 border-rose-200',
    gold: 'bg-amber-50 text-amber-800 border-amber-200',
    green: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    blue: 'bg-sky-50 text-sky-800 border-sky-200',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
  }[variant];

  const dotClasses = {
    maroon: 'bg-[#8F0000]',
    red: 'bg-[#D00000]',
    gold: 'bg-[#D99016]',
    green: 'bg-emerald-600',
    blue: 'bg-sky-600',
    slate: 'bg-slate-500',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold font-mono rounded-full border shadow-2xs ${sizeClasses} ${variantClasses} ${className}`}
    >
      {dot && (
        <span className="flex h-1.5 w-1.5 relative flex-shrink-0">
          {pulse && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotClasses}`}
            ></span>
          )}
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dotClasses}`}></span>
        </span>
      )}
      <span>{children}</span>
    </span>
  );
}
