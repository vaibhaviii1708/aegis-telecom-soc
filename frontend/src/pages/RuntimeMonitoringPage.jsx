import React, { useState, useEffect } from 'react';
import { 
  Server, Activity, ShieldCheck, ArrowRight, Radio, 
  Cpu, Zap, HardDrive, ArrowDown, RefreshCw
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { api } from '../services/api';

export const RuntimeMonitoringPage = () => {
  const [services, setServices] = useState([]);
  const [telemetry, setTelemetry] = useState([]);
  const [topology, setTopology] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadRuntime = async () => {
    try {
      setLoading(true);
      const [srv, tel, top] = await Promise.all([
        api.getRuntimeServices(),
        api.getRuntimeTelemetry('ALL', 'ALL'),
        api.getRuntimeTopology()
      ]);
      setServices(srv);
      setTelemetry(tel);
      setTopology(top);
    } catch (err) {
      console.error('Failed to load runtime telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRuntime();
  }, []);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-lg border border-slate-200/90 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-semibold">
                3GPP Service-Based Architecture (SBA)
              </span>
              <span className="text-xs text-slate-400">Application Telemetry Mirror</span>
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-1">
              Cloud-Native Telecom Runtime & Microservices Mesh
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live operational health, signaling velocity, and active security mesh interconnects
            </p>
          </div>

          <button
            onClick={loadRuntime}
            className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-md text-xs font-medium hover:bg-slate-50 transition-colors flex items-center space-x-1.5 self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Poll Telemetry</span>
          </button>
        </div>
      </div>

      {/* 2. Microservices Architecture Topology Grid */}
      <div className="bg-white rounded-lg border border-slate-200/90 p-5 shadow-2xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-4 flex items-center space-x-2">
          <Server className="w-4 h-4 text-indigo-600" />
          <span>Microservices Topology & Network Functions</span>
        </h3>

        {/* Visual Architecture Flow Layout */}
        <div className="space-y-4">
          {/* Layer 1: Edge & Ingress */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-2 font-bold">
              Layer 01 — Perimeter & Ingress Control
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-white rounded border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Radio className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-bold text-slate-900">End-User Devices & Gateways</span>
                  </div>
                  <Badge variant="healthy" size="xs">156 ACTIVE</Badge>
                </div>
                <div className="mt-2 text-[11px] text-slate-500">
                  Simulated 5G User Equipment (UE), NB-IoT Sensors, and Partner API Nodes
                </div>
              </div>

              <div className="p-3 bg-white rounded border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Server className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-900">5G Ingress Gateway (Envoy / Envoy-SBA)</span>
                  </div>
                  <Badge variant="healthy" size="xs">OPERATIONAL</Badge>
                </div>
                <div className="mt-2 text-[11px] text-slate-600 font-mono">
                  Rate: 142.5 req/s | Latency: 8.2ms | HTTP/2 & gRPC Ingress
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center -my-2 text-slate-400">
            <ArrowDown className="w-4 h-4 animate-bounce" />
          </div>

          {/* Layer 2: Core Telecom Microservices */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-2 font-bold">
              Layer 02 — Core 3GPP Microservices
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {services.map((srv) => (
                <div key={srv.id} className="p-3 bg-white rounded border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{srv.name}</span>
                    <Badge variant={srv.operational_status} size="xs">
                      {srv.operational_status}
                    </Badge>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-600 font-mono">
                    <div>
                      <span className="text-slate-400 font-sans block text-[10px]">Throughput:</span>
                      <span className="font-bold text-slate-800">{srv.request_rate} req/s</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-sans block text-[10px]">Avg Latency:</span>
                      <span className="font-bold text-slate-800">{srv.latency_ms} ms</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center -my-2 text-slate-400">
            <ArrowDown className="w-4 h-4 animate-bounce" />
          </div>

          {/* Layer 3: Security & Response Mesh */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-2 font-bold">
              Layer 03 — Intelligence & Automated Enforcement
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-indigo-50/50 rounded border border-indigo-200 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Cpu className="w-4 h-4 text-indigo-700" />
                    <span className="text-xs font-bold text-indigo-950">AI Threat Detection Engine</span>
                  </div>
                  <Badge variant="healthy" size="xs">ACTIVE</Badge>
                </div>
                <div className="mt-1 text-[11px] text-indigo-900 font-mono">
                  Isolation Forest ML + Feature Pipeline | Stream Inference &lt; 4.5ms
                </div>
              </div>

              <div className="p-3 bg-emerald-50/50 rounded border border-emerald-200 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-emerald-700" />
                    <span className="text-xs font-bold text-emerald-950">Automated Response Engine</span>
                  </div>
                  <Badge variant="healthy" size="xs">PROTECTED</Badge>
                </div>
                <div className="mt-1 text-[11px] text-emerald-900 font-mono">
                  Policy-101 / 204 / 308 / 401 Dynamic Rate Limiting & Bearer Teardown
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Runtime Telemetry Stream Table */}
      <div className="bg-white rounded-lg border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Live Microservice Telemetry & Audit Stream
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Synthetic application-level microservice telemetry logs
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {telemetry.length} Log Records
          </span>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider sticky top-0 z-10">
              <tr>
                <th className="py-2.5 px-4">Timestamp (UTC)</th>
                <th className="py-2.5 px-4">Microservice Component</th>
                <th className="py-2.5 px-4">Event Description</th>
                <th className="py-2.5 px-4">Severity</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Telemetry Payload Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {telemetry.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">
                    {new Date(t.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                    {t.component}
                  </td>
                  <td className="py-2.5 px-4 font-sans text-slate-800 font-medium">
                    {t.event}
                  </td>
                  <td className="py-2.5 px-4 font-sans">
                    <Badge variant={t.severity} size="sm">
                      {t.severity}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-4 font-sans">
                    <Badge variant={t.status} size="sm">
                      {t.status}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-4 text-slate-600 font-sans max-w-sm truncate" title={t.details}>
                    {t.details}
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
