import React, { useState, useEffect } from 'react';
import { 
  Cpu, ArrowRight, ShieldAlert, AlertTriangle, CheckCircle2, 
  HelpCircle, Terminal, Play, Layers, Sliders, Info
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { api } from '../services/api';

export const AIThreatDetectionPage = () => {
  const [modelInfo, setModelInfo] = useState(null);
  const [threats, setThreats] = useState([]);
  const [loading, setLoading] = useState(true);

  // Interactive Live Inference Test State
  const [testDevice, setTestDevice] = useState('UE-Custom-Tester');
  const [testRate, setTestRate] = useState(48.0);
  const [testReqType, setTestReqType] = useState('AUTHENTICATE_DEVICE');
  const [testAuthFail, setTestAuthFail] = useState(12);
  const [testApiSuspicion, setTestApiSuspicion] = useState(0);
  const [inferenceResult, setInferenceResult] = useState(null);
  const [isInferring, setIsInferring] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [info, th] = await Promise.all([
          api.getModelInfo(),
          api.getThreats('ALL')
        ]);
        setModelInfo(info);
        setThreats(th);
      } catch (err) {
        console.error('Failed to load AI threat data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleRunInference = async () => {
    try {
      setIsInferring(true);
      const res = await api.analyzeTelemetry({
        source_device: testDevice,
        request_rate: parseFloat(testRate),
        request_type: testReqType,
        failed_auth_count: parseInt(testAuthFail),
        suspicious_api_count: parseInt(testApiSuspicion)
      });
      setInferenceResult(res);
    } catch (err) {
      console.error('Inference error:', err);
    } finally {
      setIsInferring(false);
    }
  };

  const workflowSteps = [
    { title: 'Event Ingestion', desc: 'Continuous stream from 5G ingress & network functions' },
    { title: 'Feature Extraction', desc: 'Rate, deviation, endpoint sensitivity, auth error ratios' },
    { title: 'Baseline Comparison', desc: 'Isolation Forest distance vs normal operating vector cluster' },
    { title: 'Risk Classification', desc: 'Calibrated score mapping into Low, Medium, High, or Critical' },
    { title: 'Security Decision', desc: 'Deterministic 3GPP policy enforcement (Allow, Rate Limit, Block)' }
  ];

  return (
    <div className="space-y-6">
      {/* 1. Visual Detection Workflow Pipeline */}
      <div className="bg-white rounded-lg border border-slate-200/90 p-5 shadow-2xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-4 flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-indigo-600" />
          <span>AI Threat Detection Architecture & Decision Pipeline</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {workflowSteps.map((step, idx) => (
            <div key={idx} className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono text-indigo-600 font-bold uppercase">
                  <span>Step 0{idx + 1}</span>
                  {idx < 4 && <ArrowRight className="w-3.5 h-3.5 text-slate-400 hidden md:inline" />}
                </div>
                <h4 className="text-xs font-bold text-slate-900 mt-1.5">
                  {step.title}
                </h4>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Interactive Live Telemetry Inference Console */}
      <div className="bg-white rounded-lg border border-slate-200/90 p-5 shadow-2xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>Interactive Telemetry Inference Lab</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Input custom signaling parameters to test real-time Isolation Forest predictions
            </p>
          </div>
          <button
            onClick={handleRunInference}
            disabled={isInferring}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-colors disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run ML Inference</span>
          </button>
        </div>

        {/* Input Parameters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-4 text-xs">
          <div>
            <label className="block text-slate-600 font-medium mb-1">Source Device</label>
            <input
              type="text"
              value={testDevice}
              onChange={(e) => setTestDevice(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md bg-slate-50 font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">
              Observed Rate: <span className="font-mono font-bold text-indigo-600">{testRate} req/s</span>
            </label>
            <input
              type="range"
              min="2"
              max="120"
              step="1"
              value={testRate}
              onChange={(e) => setTestRate(e.target.value)}
              className="w-full accent-indigo-600 mt-2"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">Request Type</label>
            <select
              value={testReqType}
              onChange={(e) => setTestReqType(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md bg-slate-50 font-mono text-xs"
            >
              <option value="AUTHENTICATE_DEVICE">AUTHENTICATE_DEVICE</option>
              <option value="DATA_SESSION">DATA_SESSION</option>
              <option value="API_REQUEST">API_REQUEST</option>
              <option value="VOICE_CALL">VOICE_CALL</option>
              <option value="HANDOVER_REQUEST">HANDOVER_REQUEST</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">
              Failed Auths: <span className="font-mono font-bold text-rose-600">{testAuthFail}</span>
            </label>
            <input
              type="range"
              min="0"
              max="25"
              value={testAuthFail}
              onChange={(e) => setTestAuthFail(e.target.value)}
              className="w-full accent-rose-600 mt-2"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">
              API Probes: <span className="font-mono font-bold text-amber-600">{testApiSuspicion}</span>
            </label>
            <input
              type="range"
              min="0"
              max="15"
              value={testApiSuspicion}
              onChange={(e) => setTestApiSuspicion(e.target.value)}
              className="w-full accent-amber-600 mt-2"
            />
          </div>
        </div>

        {/* Inference Output Card */}
        {inferenceResult && (
          <div className="mt-4 p-4 rounded-lg bg-slate-900 text-white font-mono text-xs border border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="text-slate-400">Model Verdict:</span>
                <Badge variant={inferenceResult.risk_level} size="sm">
                  {inferenceResult.risk_level} (Score: {inferenceResult.risk_score}/100)
                </Badge>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-slate-400">Enforcement Action:</span>
                <Badge variant={inferenceResult.action} size="sm">
                  {inferenceResult.enforced_action || inferenceResult.action}
                </Badge>
              </div>

              <div className="text-[11px] text-slate-400">
                Isolation Forest Score: <span className="text-emerald-400">{inferenceResult.decision_score}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-slate-300">
              <div>
                <span className="text-slate-500 font-sans font-semibold">Observation:</span>
                <p className="mt-0.5 text-slate-200">{inferenceResult.observation}</p>
              </div>
              <div>
                <span className="text-slate-500 font-sans font-semibold">Detection Reason:</span>
                <p className="mt-0.5 text-slate-200">{inferenceResult.reason}</p>
              </div>
              <div>
                <span className="text-slate-500 font-sans font-semibold">Mitigation Strategy:</span>
                <p className="mt-0.5 text-indigo-300">{inferenceResult.recommended_action}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Model Architecture & Disclosure Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200/90 p-5 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Model Specifications & Feature Engineering
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <div className="text-slate-500 font-semibold text-[10px] uppercase">Algorithm</div>
              <div className="font-bold text-slate-900 mt-0.5">Isolation Forest</div>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <div className="text-slate-500 font-semibold text-[10px] uppercase">Estimators</div>
              <div className="font-bold text-slate-900 font-mono mt-0.5">100 Trees</div>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <div className="text-slate-500 font-semibold text-[10px] uppercase">Contamination</div>
              <div className="font-bold text-slate-900 font-mono mt-0.5">0.08 (8.0%)</div>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <div className="text-slate-500 font-semibold text-[10px] uppercase">Input Vector</div>
              <div className="font-bold text-slate-900 font-mono mt-0.5">6 Features</div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Extracted Telemetry Features
            </h4>
            <div className="space-y-1.5">
              {modelInfo?.features?.map((f, i) => (
                <div key={i} className="p-2.5 bg-slate-50 rounded border border-slate-200/70 text-xs flex items-center justify-between">
                  <span className="font-mono font-bold text-indigo-700">{f.name}</span>
                  <span className="text-slate-600 text-[11px] text-right">{f.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Academic Disclosure & Limitations */}
        <div className="bg-white rounded-lg border border-slate-200/90 p-5 shadow-2xs space-y-3">
          <div className="flex items-center space-x-2 text-indigo-700">
            <Info className="w-4 h-4 shrink-0" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Technical & Scope Notes
            </h3>
          </div>

          <div className="text-xs text-slate-600 space-y-2.5 leading-relaxed">
            <p>
              <strong className="text-slate-800">Synthetic Data Baseline:</strong> The anomaly engine is fitted on a synthetic distribution of 1,200 non-anomalous 5G signaling vectors representing 3GPP Rel-17 service-based architecture endpoints.
            </p>
            <p>
              <strong className="text-slate-800">Decision Fusion:</strong> Unsupervised Isolation Forest anomaly distance is calibrated into a continuous [0-100] risk scale and paired with 3GPP policy threshold rules for explainability.
            </p>
            <p>
              <strong className="text-slate-800">Academic Demonstration:</strong> This is a laboratory demonstration platform. Traffic is generated and evaluated internally; no connections to commercial carrier cell towers are simulated.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Recent Recorded Threat Detections */}
      <div className="bg-white rounded-lg border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Recorded Threat Detection Events & Audit Log
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            {threats.length} Recorded Threat Vectors
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {threats.map((t) => (
            <div key={t.id} className="p-4 hover:bg-slate-50/60 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-3">
                  <Badge variant={t.risk_level} size="md">
                    {t.risk_level} ({t.risk_score})
                  </Badge>
                  <h4 className="text-xs font-bold text-slate-900 font-mono">
                    {t.event_type} — {t.source_device}
                  </h4>
                </div>

                <div className="text-[11px] font-mono text-slate-400">
                  {new Date(t.timestamp).toLocaleString()}
                </div>
              </div>

              <div className="mt-2.5 text-xs text-slate-700 grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200/70">
                <div>
                  <span className="font-semibold text-slate-900 block">Observation:</span>
                  <p className="mt-0.5 text-slate-600 text-[11px]">{t.observation}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-900 block">Root Cause / Reason:</span>
                  <p className="mt-0.5 text-slate-600 text-[11px]">{t.reason}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-900 block">Mitigation Verdict:</span>
                  <p className="mt-0.5 text-indigo-800 text-[11px] font-medium">{t.recommended_action}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
