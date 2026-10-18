import React from 'react';

export const MetricCard = ({ title, value, subtext, icon: Icon, trend, alert = false, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-lg border p-5 shadow-sm transition-all duration-150 ${
        alert 
          ? 'border-rose-300 ring-1 ring-rose-100 bg-rose-50/20' 
          : 'border-slate-200/90 hover:border-slate-300'
      } ${onClick ? 'cursor-pointer hover:shadow' : ''}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        {Icon && (
          <div className={`p-2 rounded-md ${alert ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        {trend && (
          <span className={`text-xs font-medium ${trend.positive ? 'text-emerald-600' : 'text-slate-500'}`}>
            {trend.text}
          </span>
        )}
      </div>

      {subtext && (
        <p className="mt-1.5 text-xs text-slate-500 truncate">
          {subtext}
        </p>
      )}
    </div>
  );
};
