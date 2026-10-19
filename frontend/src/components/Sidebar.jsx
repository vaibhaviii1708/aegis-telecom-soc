import React from 'react';
import { 
  LayoutDashboard, 
  Radio, 
  GitMerge, 
  Cpu, 
  Activity, 
  ShieldAlert, 
  FileText,
  Shield,
  RadioTower,
  Server
} from 'lucide-react';

export const Sidebar = ({ activeTab, onTabChange, backendOnline = true }) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'traffic', label: 'Telecom Traffic', icon: Radio },
    { id: 'pipeline', label: 'DevSecOps Pipeline', icon: GitMerge },
    { id: 'threats', label: 'AI Threat Detection', icon: Cpu },
    { id: 'runtime', label: 'Runtime Monitoring', icon: Activity },
    { id: 'response', label: 'Automated Response', icon: ShieldAlert },
    { id: 'reports', label: 'Security Reports', icon: FileText },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-white text-base tracking-wider flex items-center space-x-1.5 font-mono">
              <span>AEGIS</span>
              <span className="text-[10px] bg-indigo-950 border border-indigo-700 text-indigo-300 px-1 py-0.2 rounded font-sans font-normal">
                SOC
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              AI-Driven Telecom Security
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Security Operations Center
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom System Telemetry */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 text-[11px] space-y-2">
        <div className="flex items-center justify-between text-slate-400">
          <span>Environment:</span>
          <span className="text-slate-200 font-mono font-medium">Local / Lab Demo</span>
        </div>

        <div className="flex items-center justify-between text-slate-400">
          <span>Platform:</span>
          <span className="text-slate-200 font-mono font-medium">v1.0.0 (3GPP Rel-17)</span>
        </div>

        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
          <span className="text-slate-400">Backend Core:</span>
          <div className="flex items-center space-x-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                backendOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span className={`font-mono text-[10px] font-semibold ${backendOnline ? 'text-emerald-400' : 'text-rose-400'}`}>
              {backendOnline ? 'ONLINE' : 'OFFLINE / DEMO'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
