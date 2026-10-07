'use client';

import React from 'react';
import Link from 'next/link';

export interface StatCardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  icon: React.ReactNode;
  linkText?: string;
  linkHref?: string;
  variant?: 'maroon' | 'gold' | 'red' | 'green';
  className?: string;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  linkText,
  linkHref,
  variant = 'maroon',
  className = '',
}: StatCardProps) {
  const iconBgClasses = {
    maroon: 'bg-red-50 text-red-700 border-red-200',
    gold: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  }[variant];

  return (
    <div
      className={`p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all duration-200 shadow-xs hover:shadow-sm flex flex-col justify-between ${className}`}
    >
      <div>
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold">{title}</span>
          <div className={`p-2 rounded-xl border ${iconBgClasses}`}>{icon}</div>
        </div>
        <div className="text-2xl font-black text-slate-900 tracking-tight">{value}</div>
      </div>

      <div className="text-xs text-slate-500 mt-2 flex items-center justify-between pt-2 border-t border-slate-100">
        <span>{subtitle}</span>
        {linkHref && linkText && (
          <Link
            href={linkHref}
            className="text-[#8F0000] hover:text-[#D00000] hover:underline font-semibold transition"
          >
            {linkText} &rarr;
          </Link>
        )}
      </div>
    </div>
  );
}
