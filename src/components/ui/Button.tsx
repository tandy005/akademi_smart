'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'gold' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center font-bold rounded-xl transition duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';

  const sizeClasses = {
    xs: 'px-2.5 py-1 text-[11px] gap-1',
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-xs sm:text-sm gap-2',
    lg: 'px-5 py-2.5 text-sm sm:text-base gap-2.5',
  }[size];

  const variantClasses = {
    primary:
      'bg-gradient-to-r from-smart-maroon via-smart-red to-smart-maroon hover:brightness-110 text-white shadow-md shadow-smart-red/20 border border-smart-red/50 focus:ring-smart-red',
    gold:
      'bg-gradient-to-r from-smart-gold via-smart-gold-light to-smart-gold hover:brightness-105 text-slate-900 shadow-md shadow-smart-gold/20 border border-smart-gold-light/60 font-extrabold focus:ring-smart-gold',
    secondary:
      'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 shadow-xs focus:ring-slate-400',
    outline:
      'bg-white hover:bg-slate-50 text-[#8F0000] border border-slate-300 hover:border-[#8F0000] focus:ring-[#8F0000]',
    danger:
      'bg-red-600 hover:bg-red-700 text-white shadow-xs border border-red-500 focus:ring-red-500',
    ghost:
      'bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 focus:ring-slate-300',
  }[variant];

  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        icon && <span className="flex-shrink-0">{icon}</span>
      )}
      <span>{children}</span>
    </button>
  );
}
