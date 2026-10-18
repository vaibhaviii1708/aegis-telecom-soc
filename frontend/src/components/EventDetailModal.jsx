import React from 'react';
import { X, Shield, AlertTriangle, ArrowRight, Server, Radio, Clock, Cpu } from 'lucide-react';
import { Badge } from './Badge';

export const EventDetailModal = ({ event, onClose }) => {
  if (!event) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden transition-all">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-slate-800 rounded-lg text-sky-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-wide text-white uppercase font-mono">
                Security Event Inspection — #{event.id}
              </h3>
              <p className="text-xs text-slate-400">
                Logged at: {new Date(event.timestamp).toLocaleString()}
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

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Key Indicators Row */}
          <div className="grid grid-cols-3 gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200/80">
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Risk Classification</div>
              <div className="mt-1">
                <Badge variant={event.classification} size="md">
                  {event.classification}
                </Badge>
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Composite Risk Score</div>
              <div className="mt-1 font-mono text-base font-bold text-slate-900">
                {event.risk_score} / 100
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Action Enforced</div>
              <div className="mt-1">
                <Badge variant={event.action} size="md">
                  {event.action}
                </Badge>
              </div>
            </div>
          </div>

          {/* Signaling Pathway */}
          <div>
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Signaling Path & Flow
            </h4>
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <Radio className="w-4 h-4 text-slate-500" />
                <span className="font-semibold text-slate-800 font-mono">{event.source_device}</span>
              </div>
              <div className="flex items-center space-x-1 text-slate-400">
                <span className="text-[11px] font-mono px-1.5 py-0.5 bg-white border rounded text-slate-600">
                  {event.request_type}
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex items-center space-x-2">
                <Server className="w-4 h-4 text-slate-500" />
                <span className="font-semibold text-slate-800">{event.destination_service}</span>
              </div>
            </div>
          </div>

          {/* Detection Rationale */}
          <div>
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <Cpu className="w-4 h-4 text-indigo-500" />
              <span>AI Anomaly Analysis & Observation</span>
            </h4>
            <div className="p-4 bg-indigo-50/40 rounded-lg border border-indigo-100 text-xs text-slate-800 space-y-2">
              <p className="font-medium text-slate-900">
                {event.detection_reason}
              </p>
              <div className="pt-2 border-t border-indigo-100/80 grid grid-cols-2 gap-4 text-slate-600">
                <div>
                  <span className="text-slate-500">Observed Rate:</span>{' '}
                  <span className="font-mono font-semibold text-slate-800">{event.request_rate} req/s</span>
                </div>
                <div>
                  <span className="text-slate-500">Record Origin:</span>{' '}
                  <span className="font-semibold text-slate-700">
                    {event.is_sample ? 'Preloaded Baseline Sample' : 'Live Generated Event'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Telemetry Trace Snippet */}
          <div>
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Structured Log Payload
            </h4>
            <pre className="p-3 bg-slate-900 text-slate-200 rounded-lg text-[11px] font-mono overflow-x-auto leading-relaxed">
{JSON.stringify({
  event_id: event.id,
  timestamp_utc: event.timestamp,
  source: event.source_device,
  destination: event.destination_service,
  signaling_type: event.request_type,
  throughput_rate: `${event.request_rate} req/s`,
  anomaly_score: event.risk_score,
  verdict: event.classification,
  enforcement: event.action,
  inspection_flag: event.is_sample ? "BASELINE_RECORD" : "LIVE_SIMULATION_BURST"
}, null, 2)}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-medium rounded-md hover:bg-slate-100 transition-colors"
          >
            Close Inspection
          </button>
        </div>
      </div>
    </div>
  );
};
