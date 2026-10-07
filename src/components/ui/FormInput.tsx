'use client';

import React from 'react';

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helperText?: string;
  error?: string;
}

export function FormInput({
  label,
  helperText,
  error,
  className = '',
  id,
  required,
  ...props
}: FormInputProps) {
  const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="space-y-1 text-xs">
      <label htmlFor={inputId} className="block text-slate-700 font-semibold">
        {label} {required && <span className="text-[#8F0000]">*</span>}
      </label>
      <input
        id={inputId}
        required={required}
        className={`w-full px-3 py-2 bg-slate-50 border ${
          error ? 'border-red-500' : 'border-slate-300 focus:border-[#8F0000] focus:ring-1 focus:ring-[#8F0000]'
        } rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none transition font-normal ${className}`}
        {...props}
      />
      {error ? (
        <p className="text-[11px] text-red-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}

export interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  helperText?: string;
  error?: string;
  children: React.ReactNode;
}

export function FormSelect({
  label,
  helperText,
  error,
  className = '',
  id,
  required,
  children,
  ...props
}: FormSelectProps) {
  const selectId = id || `select-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="space-y-1 text-xs">
      <label htmlFor={selectId} className="block text-slate-700 font-semibold">
        {label} {required && <span className="text-[#8F0000]">*</span>}
      </label>
      <select
        id={selectId}
        required={required}
        className={`w-full px-3 py-2 bg-slate-50 border ${
          error ? 'border-red-500' : 'border-slate-300 focus:border-[#8F0000] focus:ring-1 focus:ring-[#8F0000]'
        } rounded-xl text-slate-900 focus:bg-white focus:outline-none transition font-medium ${className}`}
        {...props}
      >
        {children}
      </select>
      {error ? (
        <p className="text-[11px] text-red-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}
