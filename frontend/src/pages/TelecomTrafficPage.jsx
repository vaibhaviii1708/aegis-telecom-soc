import React, { useState, useEffect } from 'react';
import { 
  Radio, Play, Pause, RefreshCw, Filter, Search, 
  ShieldAlert, Activity, Wifi, Server, CheckCircle2, AlertOctagon, Cpu
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { api } from '../services/api';

export const TelecomTrafficPage = ({ onSelectEvent, onTriggerScenarioRefresh }) => {
  const [devices, setDevices] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedRisk, setSelectedRisk] = useState('ALL');
  const [search, setSearch] = useState('');
  const [runningScenario, setRunningScenario] = useState(null);
  const [scenarioStatus, setScenarioStatus] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [devs, evs] = await Promise.all([
        api.getDevices(),
        api.getTrafficEvents({ limit: 100 })
      ]);
      setDevices(devs);
      setEvents(evs);
    } catch (err) {
      console.error('Failed to load telecom traffic data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleScenarioClick = async (scenarioType) => {
    try {
      setRunningScenario(scenarioType);
      setScenarioStatus({ type: 'info', message: `Executing scenario: ${scenarioType}...` });
      
      const res = await api.triggerScenario(scenarioType, null, 6);
      setScenarioStatus({ 
        type: 'success', 
        message: `${res.message} [Action: ${res.action_taken || 'ALLOW'}]` 
      });

      await loadData();
      if (onTriggerScenarioRefresh) {
        onTriggerScenarioRefresh();
      }
    } catch (err) {
      setScenarioStatus({ type: 'error', message: err.message || 'Scenario run failed' });
    } finally {
      setRunningScenario(null);
    }
  };

  const handleResetFilters = () => {
    setSelectedDevice('ALL');
    setSelectedType('ALL');
    setSelectedRisk('ALL');
    setSearch('');
  };

  // Filtered Events
  const filteredEvents = events.filter((ev) => {
    const matchDevice = selectedDevice === 'ALL' || ev.source_device === selectedDevice;
    const matchType = selectedType === 'ALL' || ev.request_type === selectedType;
    const matchRisk = selectedRisk === 'ALL' || 
      (selectedRisk === 'NORMAL' && ev.classification === 'NORMAL') ||
      (selectedRisk === 'LOW' && ev.risk_score <= 35 && ev.classification !== 'NORMAL') ||
      (selectedRisk === 'MEDIUM' && ev.classification === 'SUSPICIOUS') ||
      (selectedRisk === 'HIGH' && (ev.classification === 'ANOMALY' || ev.classification === 'MALICIOUS'));

    const matchSearch = search === '' ||
      ev.source_device.toLowerCase().includes(search.toLowerCase()) ||
      ev.destination_service.toLowerCase().includes(search.toLowerCase()) ||
      ev.detection_reason.toLowerCase().includes(search.toLowerCase());

    return matchDevice && matchType && matchRisk && matchSearch;
  });

  const requestTypes = [
    'ALL', 'REGISTER_USER', 'AUTHENTICATE_DEVICE', 'VOICE_CALL',
    'SMS_REQUEST', 'DATA_SESSION', 'API_REQUEST', 'HANDOVER_REQUEST'
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header & Interactive Scenario Bar */}
      <div className="bg-white rounded-lg border border-slate-200/90 p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
              <Radio className="w-4 h-4 text-indigo-600" />
              <span>Interactive Telecom Traffic Scenarios</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Inject synthetic application-level 5G signaling and observer-driven security actions
            </p>
          </div>

          {/* Quick Scenario Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleScenarioClick('NORMAL_TRAFFIC')}
              disabled={runningScenario !== null}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-medium rounded-md transition-colors flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Normal Traffic</span>
            </button>

            <button
              onClick={() => handleScenarioClick('AUTH_FLOOD')}
              disabled={runningScenario !== null}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-medium rounded-md transition-colors flex items-center space-x-1.5 disabled:opacity-50"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Auth Flood</span>
            </button>

            <button
              onClick={() => handleScenarioClick('SUSPICIOUS_API')}
              disabled={runningScenario !== null}
              className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-medium rounded-md transition-colors flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Suspicious API</span>
            </button>

            <button
              onClick={() => handleScenarioClick('DDOS_BURST')}
              disabled={runningScenario !== null}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-medium rounded-md transition-colors flex items-center space-x-1.5 disabled:opacity-50"
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>DDoS Burst</span>
            </button>
          </div>
        </div>

        {/* Live Scenario Alert Feedback */}
        {scenarioStatus && (
          <div className={`mt-3 p-3 rounded-md text-xs border flex items-center space-x-2 ${
            scenarioStatus.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : scenarioStatus.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-indigo-50 text-indigo-800 border-indigo-200'
          }`}>
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-medium">{scenarioStatus.message}</span>
          </div>
        )}
      </div>

      {/* 2. Telecom Device Inventory */}
      <div className="bg-white rounded-lg border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Telecom Device & Node Inventory
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Attached user equipment (UE), IoT aggregators, and core service adapters
            </p>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {devices.length} Monitored Entities
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Device Identifier</th>
                <th className="py-2.5 px-4">Device Type</th>
                <th className="py-2.5 px-4">Assigned IP Address</th>
                <th className="py-2.5 px-4">Current Rate</th>
                <th className="py-2.5 px-4">Total Signaling Requests</th>
                <th className="py-2.5 px-4">Risk Level</th>
                <th className="py-2.5 px-4">Operational Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {devices.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-bold text-slate-900">
                    {d.device_id}
                  </td>
                  <td className="py-2.5 px-4 font-sans text-slate-700">
                    {d.device_type}
                  </td>
                  <td className="py-2.5 px-4 text-slate-600">
                    {d.ip_address}
                  </td>
                  <td className="py-2.5 px-4 text-slate-800 font-semibold">
                    {d.request_rate} req/s
                  </td>
                  <td className="py-2.5 px-4 text-slate-700">
                    {d.total_requests.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4 font-sans">
                    <Badge variant={d.risk_level} size="sm">
                      {d.risk_level}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-4 font-sans">
                    <Badge variant={d.status} size="sm">
                      {d.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Traffic Event Table */}
      <div className="bg-white rounded-lg border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Telecom Signaling Stream Log
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspect application-level 5G request vectors and policy actions
            </p>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search events..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-md border border-slate-300 bg-white text-xs text-slate-800 w-44 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Device Filter */}
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="py-1.5 px-2.5 rounded-md border border-slate-300 bg-white text-xs text-slate-800"
            >
              <option value="ALL">All Devices</option>
              {devices.map((d) => (
                <option key={d.device_id} value={d.device_id}>{d.device_id}</option>
              ))}
            </select>

            {/* Request Type */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="py-1.5 px-2.5 rounded-md border border-slate-300 bg-white text-xs text-slate-800"
            >
              {requestTypes.map((t) => (
                <option key={t} value={t}>{t === 'ALL' ? 'All Types' : t}</option>
              ))}
            </select>

            {/* Risk Filter */}
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="py-1.5 px-2.5 rounded-md border border-slate-300 bg-white text-xs text-slate-800"
            >
              <option value="ALL">All Risks</option>
              <option value="NORMAL">Normal</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High / Critical</option>
            </select>

            {/* Clear Filters */}
            <button
              onClick={handleResetFilters}
              className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-md hover:bg-slate-100"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider sticky top-0 z-10">
              <tr>
                <th className="py-2.5 px-4">Timestamp (UTC)</th>
                <th className="py-2.5 px-4">Source Device</th>
                <th className="py-2.5 px-4">Request Type</th>
                <th className="py-2.5 px-4">Destination Service</th>
                <th className="py-2.5 px-4">Rate (req/s)</th>
                <th className="py-2.5 px-4">Risk Score</th>
                <th className="py-2.5 px-4">Classification</th>
                <th className="py-2.5 px-4">Enforcement</th>
                <th className="py-2.5 px-4">Detection Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEvents.map((ev) => (
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
                  <td className="py-2.5 px-4 font-mono text-slate-700 font-semibold">
                    {ev.request_rate}
                  </td>
                  <td className="py-2.5 px-4 font-mono font-bold text-slate-800">
                    {ev.risk_score}
                  </td>
                  <td className="py-2.5 px-4">
                    <Badge variant={ev.classification} size="sm">
                      {ev.classification}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-4">
                    <Badge variant={ev.action} size="sm">
                      {ev.action}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-4 text-slate-600 max-w-sm truncate" title={ev.detection_reason}>
                    {ev.detection_reason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
