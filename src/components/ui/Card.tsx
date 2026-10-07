'use client';

import React from 'react';

export function Card({
  children,
  className = '',
  highlight = false,
}: {
  children: React.ReactNode;
  className?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl bg-white border transition-all duration-200 shadow-xs ${
        highlight
          ? 'border-smart-gold/60 ring-1 ring-smart-gold/30 shadow-md'
          : 'border-slate-200/90 hover:border-slate-300 hover:shadow-sm'
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between gap-3 ${className}`}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3 className={`font-bold text-base sm:text-lg text-slate-900 tracking-tight ${className}`}>
      {children}
    </h3>
  );
}

export function CardDescription({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <p className={`text-xs text-slate-500 mt-0.5 ${className}`}>{children}</p>;
}

export function CardContent({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`p-5 sm:p-6 text-slate-800 ${className}`}>{children}</div>;
}

export function CardFooter({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 rounded-b-2xl flex items-center justify-between gap-3 ${className}`}
    >
      {children}
    </div>
  );
}
