import React from 'react';
import { RefreshCw, Play, Bell, ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Badge } from './Badge';

export const TopNavbar = ({
  pageTitle,
  breadcrumbs = [],
  systemStatus = 'OPERATIONAL',
  securityPosture = 'OPTIMAL',
  postureScore = 94.2,
  lastUpdated,
  onReset,
  onOpenScenario,
  isRefreshing = false
}) => {
  const getStatusBadge = (status) => {
    if (status === 'CRITICAL ALERT') {
      return (
        <Badge variant="critical" size="md" className="flex items-center space-x-1 font-mono">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
          <span>CRITICAL ALERT</span>
        </Badge>
      );
    }
    if (status === 'ELEVATED RISK') {
      return (
        <Badge variant="warning" size="md" className="flex items-center space-x-1 font-mono">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>ELEVATED RISK</span>
        </Badge>
      );
    }
    return (
      <Badge variant="healthy" size="md" className="flex items-center space-x-1 font-mono">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>OPERATIONAL</span>
      </Badge>
    );
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-2xs">
      {/* Page Title & Breadcrumbs */}
      <div>
        <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium">
          <span>AEGIS SOC</span>
          {breadcrumbs.map((b, i) => (
            <React.Fragment key={i}>
              <span className="text-slate-300">/</span>
              <span className={i === breadcrumbs.length - 1 ? 'text-slate-800 font-semibold' : ''}>
                {b}
              </span>
            </React.Fragment>
          ))}
        </div>
        <h1 className="text-base font-bold text-slate-900 tracking-tight">
          {pageTitle}
        </h1>
      </div>

      {/* Right Controls & Telemetry */}
      <div className="flex items-center space-x-4">
        {/* System Status Indicator */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
            Status:
          </span>
          {getStatusBadge(systemStatus)}
        </div>

        {/* Security Posture Index */}
        <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-slate-50 rounded-md border border-slate-200 text-xs">
          <span className="text-slate-500">Posture:</span>
          <span className="font-bold text-slate-800 font-mono">
            {securityPosture} ({postureScore}%)
          </span>
        </div>

        {/* Last Updated Timestamp */}
        <div className="text-[11px] text-slate-600 font-mono hidden lg:inline">
          Sync: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'Just now'}
        </div>

        {/* Scenario Injection Trigger */}
        <button
          onClick={onOpenScenario}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-colors"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Inject Traffic</span>
        </button>

        {/* Reset to Baseline */}
        <button
          onClick={onReset}
          disabled={isRefreshing}
          title="Reset environment to verified baseline dataset"
          className="p-1.5 text-slate-500 hover:text-slate-800 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
        </button>
      </div>
    </header>
  );
};
