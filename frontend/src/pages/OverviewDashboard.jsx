import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, AlertTriangle, ShieldAlert, Activity, 
  Search, Filter, ArrowUpRight, CheckCircle2, ChevronRight,
  Database, Radio, Cpu, Lock, GitBranch, ArrowRight
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  Tooltip, Legend, CartesianGrid, PieChart, Pie, Cell 
} from 'recharts';
import { MetricCard } from '../components/MetricCard';
import { Badge } from '../components/Badge';

export const OverviewDashboard = ({ data, onSelectEvent, onOpenScenario, onNavigate }) => {
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [eventTypeFilter, setEventTypeFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const rowsPerPage = 8;

  const metrics = data?.metrics || {};
  const timeSeries = data?.traffic_time_series || [];
  const riskDistribution = data?.risk_distribution || [];
  const recentEvents = data?.recent_events || [];
  const lifecycleStages = data?.lifecycle_stages || [];

  // Filter and search recent events
  const filteredEvents = useMemo(() => {
    return recentEvents.filter((ev) => {
      const matchSearch = search === '' || 
        ev.source_device.toLowerCase().includes(search.toLowerCase()) ||
        ev.destination_service.toLowerCase().includes(search.toLowerCase()) ||
        ev.detection_reason.toLowerCase().includes(search.toLowerCase());
      
      const matchRisk = riskFilter === 'ALL' || 
        (riskFilter === 'NORMAL' && ev.classification === 'NORMAL') ||
        (riskFilter === 'LOW' && ev.risk_score <= 35 && ev.classification !== 'NORMAL') ||
        (riskFilter === 'MEDIUM' && ev.classification === 'SUSPICIOUS') ||
        (riskFilter === 'HIGH' && (ev.classification === 'ANOMALY' || ev.classification === 'MALICIOUS'));

      const matchType = eventTypeFilter === 'ALL' || ev.request_type === eventTypeFilter;

      return matchSearch && matchRisk && matchType;
    });
  }, [recentEvents, search, riskFilter, eventTypeFilter]);

  const totalPages = Math.ceil(filteredEvents.length / rowsPerPage) || 1;
  const paginatedEvents = filteredEvents.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const requestTypes = ['ALL', 'REGISTER_USER', 'AUTHENTICATE_DEVICE', 'VOICE_CALL', 'SMS_REQUEST', 'DATA_SESSION', 'API_REQUEST', 'HANDOVER_REQUEST'];

  return (
    <div className="space-y-6">
      {/* 1. Security Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Processed Requests"
          value={metrics.total_requests || 12840}
          subtext="Cloud-native telecom signaling events"
          icon={Activity}
          trend={{ text: '+14.2% ingress', positive: true }}
        />

        <MetricCard
          title="Threats Flagged & Detected"
          value={metrics.threats_detected || 24}
          subtext="Isolation Forest & heuristic alerts"
          icon={AlertTriangle}
          alert={metrics.threats_detected > 20}
          trend={{ text: `${metrics.open_alerts || 1} unmitigated`, positive: false }}
        />

        <MetricCard
          title="Malicious Requests Blocked"
          value={metrics.requests_blocked || 18}
          subtext="Contained via automated policy rules"
          icon={ShieldAlert}
          alert={metrics.requests_blocked > 0}
          trend={{ text: 'Enforced at ingress', positive: true }}
        />

        <MetricCard
          title="Active Devices & Nodes"
          value={metrics.active_devices || 156}
          subtext="Connected UEs, IoT & API clients"
          icon={Radio}
          trend={{ text: 'Fleet operational', positive: true }}
        />
      </div>

      {/* 2. Security Lifecycle Workflow Representation */}
      <div className="bg-white rounded-lg border border-slate-200/90 p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>DevSecOps Telecom Security Lifecycle</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Integrated pipeline and runtime defense posture across the application continuum
            </p>
          </div>
          <button 
            onClick={() => onNavigate('pipeline')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
          >
            <span>Inspect Pipeline</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {lifecycleStages.map((stage) => {
            const isBlocked = stage.status === 'BLOCKED' || stage.status === 'FAILED';
            const isWarn = stage.status === 'WARNING' || stage.status === 'FLAGGED';
            const isSuccess = stage.status === 'PASSED' || stage.status === 'ACTIVE' || stage.status === 'VERIFIED' || stage.status === 'COMPLETED' || stage.status === 'ENFORCING' || stage.status === 'STREAMING';

            return (
              <div 
                key={stage.step}
                className={`p-2.5 rounded-md border text-center transition-all ${
                  isBlocked 
                    ? 'border-rose-300 bg-rose-50/40 text-rose-900' 
                    : isWarn
                    ? 'border-amber-300 bg-amber-50/40 text-amber-900'
                    : 'border-slate-200 bg-slate-50/60 text-slate-800'
                }`}
              >
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                  Step 0{stage.step}
                </div>
                <div className="text-xs font-bold truncate mt-0.5">
                  {stage.stage}
                </div>
                <div className="mt-1">
                  <Badge 
                    variant={isBlocked ? 'critical' : isWarn ? 'warning' : 'healthy'}
                    size="xs"
                  >
                    {stage.status}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Charts Row: Traffic Dynamics & Risk Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Traffic Monitoring Line Chart */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Telecom Traffic Dynamics (Requests / Sec)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time throughput comparison across normal, suspicious, and blocked channels
              </p>
            </div>
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 bg-slate-100 rounded text-slate-600">
              Sliding 45-min Window
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeries} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} unit=" r/s" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderRadius: '6px', 
                    border: 'none', 
                    color: '#fff', 
                    fontSize: '11px',
                    fontFamily: 'monospace' 
                  }} 
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line 
                  type="monotone" 
                  dataKey="normal" 
                  name="Normal Traffic" 
                  stroke="#10b981" 
                  strokeWidth={2} 
                  dot={false} 
                />
                <Line 
                  type="monotone" 
                  dataKey="suspicious" 
                  name="Suspicious (Flagged)" 
                  stroke="#f59e0b" 
                  strokeWidth={2} 
                  dot={false} 
                />
                <Line 
                  type="monotone" 
                  dataKey="blocked" 
                  name="Blocked / Dropped" 
                  stroke="#e11d48" 
                  strokeWidth={2.5} 
                  dot={{ r: 3 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution Chart */}
        <div className="bg-white rounded-lg border border-slate-200/90 p-5 shadow-2xs flex flex-col">
          <div className="mb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Security Event Risk Profile
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Classification volume breakdown
            </p>
          </div>

          <div className="h-52 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderRadius: '6px', 
                    border: 'none', 
                    color: '#fff', 
                    fontSize: '11px' 
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend Table */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
            {riskDistribution.map((r, i) => (
              <div key={i} className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                <span className="text-slate-600 text-[11px] truncate">{r.name}:</span>
                <span className="font-mono font-bold text-slate-900 text-[11px]">{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Recent Security Events Table */}
      <div className="bg-white rounded-lg border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Recent Security & Telecom Events
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live streaming audit trail of inspected signaling requests and policy verdicts
            </p>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search device, service, reason..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-8 pr-3 py-1.5 rounded-md border border-slate-300 bg-white text-xs text-slate-800 w-52 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Risk Filter */}
            <select
              value={riskFilter}
              onChange={(e) => { setRiskFilter(e.target.value); setPage(1); }}
              className="py-1.5 px-2.5 rounded-md border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="NORMAL">Normal</option>
              <option value="LOW">Low Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="HIGH">High / Critical</option>
            </select>

            {/* Request Type Filter */}
            <select
              value={eventTypeFilter}
              onChange={(e) => { setEventTypeFilter(e.target.value); setPage(1); }}
              className="py-1.5 px-2.5 rounded-md border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
            >
              {requestTypes.map((t) => (
                <option key={t} value={t}>
                  {t === 'ALL' ? 'All Request Types' : t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Timestamp (UTC)</th>
                <th className="py-2.5 px-4">Source Device</th>
                <th className="py-2.5 px-4">Request Type</th>
                <th className="py-2.5 px-4">Destination Service</th>
                <th className="py-2.5 px-4">Rate (req/s)</th>
                <th className="py-2.5 px-4">Risk Verdict</th>
                <th className="py-2.5 px-4">Enforcement</th>
                <th className="py-2.5 px-4">Detection Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedEvents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No security events match the selected criteria.
                  </td>
                </tr>
              ) : (
                paginatedEvents.map((ev) => (
                  <tr
                    key={ev.id}
                    onClick={() => onSelectEvent(ev)}
                    className="hover:bg-indigo-50/40 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(ev.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-medium text-slate-900 whitespace-nowrap">
                      {ev.source_device}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="font-mono text-[11px] px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-700">
                        {ev.request_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 whitespace-nowrap">
                      {ev.destination_service}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-700">
                      {ev.request_rate}
                    </td>
                    <td className="py-2.5 px-4">
                      <Badge variant={ev.classification} size="sm">
                        {ev.classification} ({ev.risk_score})
                      </Badge>
                    </td>
                    <td className="py-2.5 px-4">
                      <Badge variant={ev.action} size="sm">
                        {ev.action}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 max-w-xs truncate" title={ev.detection_reason}>
                      {ev.detection_reason}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-700">{paginatedEvents.length}</span> of{' '}
            <span className="font-semibold text-slate-700">{filteredEvents.length}</span> events
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="font-mono text-xs text-slate-700">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
