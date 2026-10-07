'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface AcademyLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textSubtitle?: string;
  className?: string;
}

export default function AcademyLogo({
  size = 'md',
  showText = true,
  textSubtitle = 'Volleyball Academy',
  className = '',
}: AcademyLogoProps) {
  const [imageError, setImageError] = useState(false);

  const sizeDimensions = {
    sm: { width: 32, height: 32, class: 'w-8 h-8', textClass: 'text-sm' },
    md: { width: 44, height: 44, class: 'w-11 h-11', textClass: 'text-base sm:text-lg' },
    lg: { width: 56, height: 56, class: 'w-14 h-14', textClass: 'text-xl' },
    xl: { width: 80, height: 80, class: 'w-20 h-20', textClass: 'text-2xl' },
  }[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Image */}
      <div
        className={`${sizeDimensions.class} relative rounded-xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-smart-maroon to-smart-dark border border-smart-gold/40 shadow-md shadow-smart-red/10 flex-shrink-0`}
      >
        {!imageError ? (
          <Image
            src="/LogoAkademi.png"
            alt="Logo Akademi Voly Smart 09"
            width={sizeDimensions.width}
            height={sizeDimensions.height}
            className="w-full h-full object-contain p-0.5"
            priority
            onError={() => setImageError(true)}
          />
        ) : (
          <span className="text-smart-gold-light font-black text-sm">S09</span>
        )}
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="leading-tight">
          <div className="flex items-center gap-1.5">
            <span className={`font-black tracking-tight text-slate-900 ${sizeDimensions.textClass}`}>
              AKADEMI VOLY <span className="text-[#8F0000]">SMART 09</span>
            </span>
          </div>
          {textSubtitle && (
            <div className="text-[11px] text-slate-500 font-medium">
              {textSubtitle}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
