import React from 'react';

export const Badge = ({ children, variant = 'neutral', size = 'sm', className = '' }) => {
  const variants = {
    normal: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    passed: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    healthy: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    
    info: 'bg-sky-50 text-sky-700 border-sky-200/80',
    low: 'bg-sky-50 text-sky-700 border-sky-200/80',
    monitored: 'bg-sky-50 text-sky-700 border-sky-200/80',
    
    warning: 'bg-amber-50 text-amber-700 border-amber-200/80',
    medium: 'bg-amber-50 text-amber-700 border-amber-200/80',
    elevated: 'bg-amber-50 text-amber-700 border-amber-200/80',
    rate_limited: 'bg-amber-50 text-amber-700 border-amber-200/80',
    suspicious: 'bg-amber-50 text-amber-700 border-amber-200/80',
    
    critical: 'bg-rose-50 text-rose-700 border-rose-200/80',
    high: 'bg-rose-50 text-rose-700 border-rose-200/80',
    danger: 'bg-rose-50 text-rose-700 border-rose-200/80',
    failed: 'bg-rose-50 text-rose-700 border-rose-200/80',
    blocked: 'bg-rose-50 text-rose-700 border-rose-200/80',
    anomaly: 'bg-rose-50 text-rose-700 border-rose-200/80',
    malicious: 'bg-rose-50 text-rose-700 border-rose-200/80',
    
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const sizes = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-medium',
  };

  const key = variant?.toLowerCase()?.replace(/\s+/g, '_') || 'neutral';
  const style = variants[key] || variants.neutral;

  return (
    <span className={`inline-flex items-center font-medium rounded border ${style} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
};
