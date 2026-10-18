import React, { useState } from 'react';
import { X, Play, AlertOctagon, ShieldAlert, Cpu, Activity, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export const ScenarioModal = ({ isOpen, onClose, onScenarioSuccess, devices = [] }) => {
  const [scenarioType, setScenarioType] = useState('AUTH_FLOOD');
  const [customDevice, setCustomDevice] = useState('');
  const [burstIntensity, setBurstIntensity] = useState(5);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const scenarios = [
    {
      id: 'NORMAL_TRAFFIC',
      name: 'Normal Operating Traffic',
      icon: Activity,
      risk: 'Normal / Permitted',
      color: 'border-emerald-500 bg-emerald-50/20 text-emerald-700',
      description: 'Generates standard user equipment session traffic (data flows, voice handshakes, registrations) within normal operating bounds.'
    },
    {
      id: 'AUTH_FLOOD',
      name: 'Authentication Flood',
      icon: ShieldAlert,
      risk: 'High Anomaly',
      color: 'border-amber-500 bg-amber-50/20 text-amber-700',
      description: 'Generates an abnormal burst of failed authentication attempts against AMF Authentication Service. Triggers ML anomaly detection and automated rate limiting.'
    },
    {
      id: 'SUSPICIOUS_API',
      name: 'Suspicious API Activity',
      icon: Cpu,
      risk: 'Medium Anomaly',
      color: 'border-sky-500 bg-sky-50/20 text-sky-700',
      description: 'Generates non-standard query parameter probes targeting internal Telecom Core APIs. Triggers automated auditing and threat flagging.'
    },
    {
      id: 'DDOS_BURST',
      name: 'DDoS-Style Traffic Burst',
      icon: AlertOctagon,
      risk: 'Critical Threat',
      color: 'border-rose-500 bg-rose-50/20 text-rose-700',
      description: 'High-volume synthetic request surge (95+ req/s) targeting Ingress Gateway. Exceeds ingress limits and triggers immediate network containment/blocking.'
    }
  ];

  const handleRun = async () => {
    setIsRunning(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.triggerScenario(
        scenarioType,
        customDevice || null,
        burstIntensity
      );
      setResult(res);
      if (onScenarioSuccess) {
        onScenarioSuccess(res);
      }
    } catch (err) {
      setError(err.message || 'Failed to execute scenario');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden transition-all">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-600/30 text-indigo-400 rounded-lg">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-wide text-white uppercase font-mono">
                Trigger Telecom Traffic Scenario
              </h3>
              <p className="text-xs text-slate-400">
                Deterministic event injection & automated DevSecOps mitigation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Scenario Selection Grid */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Select Traffic Scenario
            </label>
            <div className="space-y-2.5">
              {scenarios.map((sc) => {
                const Icon = sc.icon;
                const isSelected = scenarioType === sc.id;
                return (
                  <div
                    key={sc.id}
                    onClick={() => setScenarioType(sc.id)}
                    className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? `${sc.color} ring-1`
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <Icon className="w-4 h-4" />
                        <span className="text-xs font-bold text-slate-900">
                          {sc.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-white/80 border text-slate-600">
                        {sc.risk}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                      {sc.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Configuration Controls */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Source Device
              </label>
              <select
                value={customDevice}
                onChange={(e) => setCustomDevice(e.target.value)}
                className="w-full text-xs rounded-md border-slate-300 bg-slate-50 p-2 text-slate-800 border focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Default Scenario Target</option>
                {devices.map((d) => (
                  <option key={d.device_id} value={d.device_id}>
                    {d.device_id} ({d.device_type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Burst Event Count: <span className="font-mono text-indigo-600 font-bold">{burstIntensity}</span>
              </label>
              <input
                type="range"
                min="2"
                max="12"
                value={burstIntensity}
                onChange={(e) => setBurstIntensity(parseInt(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>Light (2)</span>
                <span>Heavy (12)</span>
              </div>
            </div>
          </div>

          {/* Success or Error Alert */}
          {result && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-emerald-900">{result.message}</p>
                {result.action_taken && (
                  <p className="text-[11px] text-emerald-700 mt-0.5 font-mono">
                    Enforcement Action: {result.action_taken} | Risk Score: {result.risk_score}/100
                  </p>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center space-x-2">
              <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-medium rounded-md hover:bg-slate-100 transition-colors"
          >
            Done / Close
          </button>

          <button
            type="button"
            disabled={isRunning}
            onClick={handleRun}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md shadow-sm transition-colors flex items-center space-x-2 disabled:opacity-60"
          >
            {isRunning ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Injecting Events...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Execute Scenario</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
