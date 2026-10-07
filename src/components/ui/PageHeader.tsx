'use client';

import React from 'react';
import Badge from './Badge';

export interface PageHeaderProps {
  badgeText?: string;
  badgeIcon?: React.ReactNode;
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
}

export default function PageHeader({
  badgeText,
  badgeIcon,
  title,
  subtitle,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        {badgeText && (
          <div className="mb-1.5 inline-flex items-center gap-1.5">
            <Badge variant="maroon" size="sm">
              <span className="flex items-center gap-1 font-semibold">
                {badgeIcon}
                <span>{badgeText}</span>
              </span>
            </Badge>
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{title}</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
          {subtitle}
        </p>
      </div>

      {actions && <div className="flex items-center gap-2 self-start sm:self-auto">{actions}</div>}
    </div>
  );
}
