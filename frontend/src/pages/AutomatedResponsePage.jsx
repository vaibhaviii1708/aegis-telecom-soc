import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, ShieldCheck, Zap, Unlock, Lock, 
  RotateCcw, Filter, CheckCircle2, AlertOctagon, Sliders, ArrowRight
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { api } from '../services/api';

export const AutomatedResponsePage = ({ onStateChanged }) => {
  const [actions, setActions] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState(null);

  // Filters
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [executionFilter, setExecutionFilter] = useState('ALL');

  // Manual Trigger Modal
  const [targetDevice, setTargetDevice] = useState('');
  const [targetAction, setTargetAction] = useState('APPLY_RATE_LIMIT');
  const [actionReason, setActionReason] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [acts, devs] = await Promise.all([
        api.getResponseActions(),
        api.getDevices()
      ]);
      setActions(acts);
      setDevices(devs);
      if (devs.length > 0 && !targetDevice) {
        setTargetDevice(devs[0].device_id);
      }
    } catch (err) {
      console.error('Failed to load response actions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReleaseBlock = async (deviceId) => {
    try {
      const res = await api.releaseDevice(deviceId);
      setStatusMsg({ type: 'success', text: res.message });
      await loadData();
      if (onStateChanged) onStateChanged();
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to release restriction' });
    }
  };

  const handleManualAction = async (e) => {
    e.preventDefault();
    if (!targetDevice) return;
    try {
      await api.manualResponseAction({
        source_device: targetDevice,
        action_type: targetAction,
        reason: actionReason || 'Manual intervention dispatched from SOC console.'
      });
      setStatusMsg({ type: 'success', text: `Enforced ${targetAction} on ${targetDevice}.` });
      setActionReason('');
      await loadData();
      if (onStateChanged) onStateChanged();
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Action execution failed' });
    }
  };

  const filteredActions = actions.filter((act) => {
    const matchRisk = riskFilter === 'ALL' || act.risk_level === riskFilter;
    const matchAction = actionFilter === 'ALL' || act.action_type === actionFilter;
    const matchExecution = executionFilter === 'ALL' || act.execution_status === executionFilter;
    return matchRisk && matchAction && matchExecution;
  });

  const activeRestrictedDevices = devices.filter(
    (d) => d.status === 'BLOCKED' || d.status === 'RATE_LIMITED'
  );

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Status */}
      <div className="bg-white rounded-lg border border-slate-200/90 p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold rounded">
                Active Containment Plane
              </span>
              <span className="text-xs text-slate-400">Zero-Trust Telephony Enforcement</span>
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-1">
              Automated Incident Containment & Policy Enforcement
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Closed-loop security actions triggered by AI threat detections or operator command
            </p>
          </div>
        </div>

        {statusMsg && (
          <div className={`mt-4 p-3 rounded-md text-xs border flex items-center justify-between ${
            statusMsg.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}>
            <span className="font-medium">{statusMsg.text}</span>
            <button 
              onClick={() => setStatusMsg(null)}
              className="text-slate-400 hover:text-slate-600 font-bold"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* 2. Active Quarantined & Throttled Devices (Quick Release Console) */}
      <div className="bg-white rounded-lg border border-slate-200/90 p-5 shadow-2xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 flex items-center space-x-2">
          <Lock className="w-4 h-4 text-rose-600" />
          <span>Currently Restricted Devices & Subnets</span>
        </h3>

        {activeRestrictedDevices.length === 0 ? (
          <div className="p-4 bg-emerald-50/40 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>No devices currently under active containment. All traffic routing normally.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeRestrictedDevices.map((dev) => (
              <div 
                key={dev.id}
                className="p-3.5 bg-rose-50/30 border border-rose-200 rounded-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-slate-900">
                      {dev.device_id}
                    </span>
                    <Badge variant={dev.status} size="xs">
                      {dev.status}
                    </Badge>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-600 font-mono">
                    IP: {dev.ip_address} | Rate: {dev.request_rate} req/s
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-500">
                    Risk Assessment: <strong className="text-rose-700">{dev.risk_level}</strong>
                  </div>
                </div>

                <button
                  onClick={() => handleReleaseBlock(dev.device_id)}
                  className="mt-3 w-full py-1.5 px-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded shadow-2xs flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Release Restriction</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Policy Matrix & Manual Enforcement Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configured Policy Matrix */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200/90 p-5 shadow-2xs space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Telecom Automated Response Policy Matrix
          </h3>
          <p className="text-xs text-slate-500">
            Standard operating rules mapped from AI risk classifications to automated mitigation
          </p>

          <div className="space-y-2 mt-2 text-xs">
            <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded flex items-center justify-between">
              <div>
                <span className="font-bold text-emerald-900">Policy-101 (Low Risk):</span>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Permit signaling with passive baseline auditing. No bandwidth penalty applied.
                </p>
              </div>
              <Badge variant="healthy" size="sm">ALLOW</Badge>
            </div>

            <div className="p-3 bg-sky-50/50 border border-sky-200 rounded flex items-center justify-between">
              <div>
                <span className="font-bold text-sky-900">Policy-204 (Medium Risk):</span>
                <p className="text-[11px] text-sky-700 mt-0.5">
                  Flag device identifier. Increase telemetry sampling rate and mirror requests to SOC log.
                </p>
              </div>
              <Badge variant="info" size="sm">FLAG & AUDIT</Badge>
            </div>

            <div className="p-3 bg-amber-50/50 border border-amber-200 rounded flex items-center justify-between">
              <div>
                <span className="font-bold text-amber-900">Policy-308 (High Risk):</span>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Apply token-bucket rate limiting (capped to 5 req/s). Enforce subscriber re-challenge.
                </p>
              </div>
              <Badge variant="warning" size="sm">RATE LIMIT</Badge>
            </div>

            <div className="p-3 bg-rose-50/50 border border-rose-200 rounded flex items-center justify-between">
              <div>
                <span className="font-bold text-rose-900">Policy-401 (Critical Threat):</span>
                <p className="text-[11px] text-rose-700 mt-0.5">
                  Immediate ingress isolation. Drop all incoming TCP/SCTP sessions at edge boundary proxy.
                </p>
              </div>
              <Badge variant="critical" size="sm">ISOLATE / BLOCK</Badge>
            </div>
          </div>
        </div>

        {/* Manual Action Form */}
        <div className="bg-white rounded-lg border border-slate-200/90 p-5 shadow-2xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
            Manual Operator Override
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Dispatches reversible containment policies to the simulated edge gateway
          </p>

          <form onSubmit={handleManualAction} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 font-medium mb-1">Target Device</label>
              <select
                value={targetDevice}
                onChange={(e) => setTargetDevice(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded bg-slate-50 font-mono text-xs"
              >
                {devices.map((d) => (
                  <option key={d.device_id} value={d.device_id}>
                    {d.device_id} ({d.status})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">Action Type</label>
              <select
                value={targetAction}
                onChange={(e) => setTargetAction(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded bg-slate-50 font-mono text-xs"
              >
                <option value="APPLY_RATE_LIMIT">APPLY_RATE_LIMIT (Policy-308)</option>
                <option value="BLOCK_SOURCE">BLOCK_SOURCE (Policy-401)</option>
                <option value="FLAG_SOURCE">FLAG_SOURCE (Policy-204)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">Incident Note / Rationale</label>
              <input
                type="text"
                placeholder="Operator justification..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded bg-slate-50 text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded shadow-xs transition-colors"
            >
              Dispatch Enforcement
            </button>
          </form>
        </div>
      </div>

      {/* 4. Complete Enforcement History Table */}
      <div className="bg-white rounded-lg border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Mitigation Action History & Audit Log
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Historical ledger of automated and manual containment invocations
            </p>
          </div>

          {/* Table Filters */}
          <div className="flex items-center space-x-2 text-xs">
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="py-1 px-2 border border-slate-300 rounded bg-white text-xs"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="py-1 px-2 border border-slate-300 rounded bg-white text-xs"
            >
              <option value="ALL">All Actions</option>
              <option value="BLOCK_SOURCE">BLOCK_SOURCE</option>
              <option value="APPLY_RATE_LIMIT">APPLY_RATE_LIMIT</option>
              <option value="FLAG_SOURCE">FLAG_SOURCE</option>
              <option value="RELEASE_BLOCK">RELEASE_BLOCK</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Timestamp (UTC)</th>
                <th className="py-2.5 px-4">Source Device</th>
                <th className="py-2.5 px-4">Risk Level</th>
                <th className="py-2.5 px-4">Enforced Action</th>
                <th className="py-2.5 px-4">Policy Rule Reference</th>
                <th className="py-2.5 px-4">Execution State</th>
                <th className="py-2.5 px-4">Enforcement Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filteredActions.map((act) => (
                <tr key={act.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">
                    {new Date(act.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                    {act.source_device}
                  </td>
                  <td className="py-2.5 px-4 font-sans">
                    <Badge variant={act.risk_level} size="sm">
                      {act.risk_level}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-4 font-sans">
                    <Badge variant={act.action_type} size="sm">
                      {act.action_type}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-4 font-sans text-slate-700 whitespace-nowrap">
                    {act.policy_rule}
                  </td>
                  <td className="py-2.5 px-4 font-sans">
                    <Badge variant={act.execution_status === 'SUCCESS' ? 'passed' : 'warning'} size="xs">
                      {act.execution_status}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-4 font-sans text-slate-600 max-w-sm truncate" title={act.details}>
                    {act.details}
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
