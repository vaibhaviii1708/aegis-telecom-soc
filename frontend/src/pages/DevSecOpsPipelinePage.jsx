import React, { useState, useEffect } from 'react';
import { 
  GitMerge, Play, ShieldAlert, CheckCircle2, AlertTriangle, 
  XCircle, Clock, FileCode, Lock, ShieldCheck, ChevronRight, RefreshCw, Cpu
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { api } from '../services/api';

export const DevSecOpsPipelinePage = ({ onPipelineRunComplete }) => {
  const [pipelineData, setPipelineData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [activeStageStep, setActiveStageStep] = useState(null);
  const [severityFilter, setSeverityFilter] = useState('ALL');

  const fetchPipeline = async () => {
    try {
      setLoading(true);
      const data = await api.getPipelineLatest();
      setPipelineData(data);
    } catch (err) {
      console.error('Failed to load pipeline:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipeline();
  }, []);

  const handleRunPipeline = async () => {
    try {
      setIsRunning(true);
      setActiveStageStep(1);

      // Visual stage progression simulation for realistic CI/CD feel
      for (let s = 1; s <= 7; s++) {
        setActiveStageStep(s);
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      const res = await api.executePipeline('release/v1.4.0-cloud-core');
      setPipelineData(res);
      if (onPipelineRunComplete) {
        onPipelineRunComplete(res);
      }
    } catch (err) {
      console.error('Pipeline execution error:', err);
    } finally {
      setIsRunning(false);
      setActiveStageStep(null);
    }
  };

  const findings = pipelineData?.findings || [];
  const stages = pipelineData?.stages || [];

  const filteredFindings = findings.filter((f) => {
    if (severityFilter === 'ALL') return true;
    return f.severity === severityFilter;
  });

  const getStageIcon = (status, isCurrentRunning) => {
    if (isCurrentRunning) {
      return <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />;
    }
    if (status === 'PASSED') {
      return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    }
    if (status === 'WARNING') {
      return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    }
    if (status === 'FAILED') {
      return <XCircle className="w-4 h-4 text-rose-600" />;
    }
    return <Clock className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Execution Control */}
      <div className="bg-white rounded-lg border border-slate-200/90 p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-semibold">
                CI/CD Security Gate
              </span>
              <span className="text-xs text-slate-400">Branch: release/v1.4.0-cloud-core</span>
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-1">
              DevSecOps Pre-Deployment Security Pipeline
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated static analysis, dependency vulnerability auditing, and policy gate decision before container admission
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleRunPipeline}
              disabled={isRunning}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors flex items-center space-x-2 disabled:opacity-60"
            >
              {isRunning ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Scanning Microservices...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>RUN SECURITY PIPELINE</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Pipeline Decision Banner */}
        {pipelineData && (
          <div className={`mt-5 p-4 rounded-lg border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
            pipelineData.deployment_decision === 'PERMITTED_TO_DEPLOY'
              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
              : 'bg-rose-50/60 border-rose-200 text-rose-900'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${
                pipelineData.deployment_decision === 'PERMITTED_TO_DEPLOY'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-700'
              }`}>
                {pipelineData.deployment_decision === 'PERMITTED_TO_DEPLOY' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <ShieldAlert className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider">
                  Automated Security Gate Verdict
                </div>
                <div className="text-sm font-extrabold font-mono mt-0.5">
                  {pipelineData.deployment_decision}
                </div>
                <div className="text-xs opacity-90 mt-0.5">
                  Pre-deployment Risk Score: <span className="font-mono font-bold">{pipelineData.risk_score} / 100</span> | Scan Duration: {pipelineData.duration_seconds}s
                </div>
              </div>
            </div>

            <Badge 
              variant={pipelineData.deployment_decision === 'PERMITTED_TO_DEPLOY' ? 'healthy' : 'critical'} 
              size="md"
            >
              {pipelineData.overall_status}
            </Badge>
          </div>
        )}
      </div>

      {/* 2. Pipeline Stages Stepper */}
      <div className="bg-white rounded-lg border border-slate-200/90 p-5 shadow-2xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-4 flex items-center space-x-2">
          <GitMerge className="w-4 h-4 text-indigo-600" />
          <span>DevSecOps Pipeline Execution Stages</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
          {stages.map((st, idx) => {
            const stepNum = idx + 1;
            const isRunningStage = isRunning && activeStageStep === stepNum;

            return (
              <div
                key={st.id}
                className={`p-3 rounded-lg border transition-all flex flex-col justify-between ${
                  isRunningStage
                    ? 'border-indigo-400 bg-indigo-50/40 ring-1 ring-indigo-300'
                    : st.status === 'FAILED'
                    ? 'border-rose-200 bg-rose-50/30'
                    : st.status === 'WARNING'
                    ? 'border-amber-200 bg-amber-50/30'
                    : 'border-slate-200 bg-slate-50/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">
                      Stage 0{stepNum}
                    </span>
                    {getStageIcon(st.status, isRunningStage)}
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 mt-1 leading-snug">
                    {st.name}
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-1 line-clamp-3 leading-relaxed">
                    {st.explanation}
                  </p>
                </div>

                <div className="pt-2 mt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>{st.duration_ms}ms</span>
                  {st.findings_count > 0 ? (
                    <span className="font-bold text-rose-600">{st.findings_count} flaws</span>
                  ) : (
                    <span className="text-emerald-600">Clean</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Detailed Security Findings Table */}
      <div className="bg-white rounded-lg border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Vulnerability Findings & Code Analysis
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Identified security flaws from the sample telecom microservice codebase
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-500 font-medium">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="py-1 px-2.5 rounded-md border border-slate-300 bg-white text-xs text-slate-800"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Severity</th>
                <th className="py-2.5 px-4">Pipeline Stage</th>
                <th className="py-2.5 px-4">Flaw Category</th>
                <th className="py-2.5 px-4">File Location</th>
                <th className="py-2.5 px-4">Description</th>
                <th className="py-2.5 px-4">Remediation Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFindings.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <Badge variant={f.severity} size="sm">
                      {f.severity}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">
                    {f.stage_name}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                    {f.finding_type}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                    {f.file_path}:{f.line_number}
                  </td>
                  <td className="py-3 px-4 text-slate-800 max-w-xs font-medium">
                    {f.description}
                  </td>
                  <td className="py-3 px-4 text-indigo-700 max-w-xs text-[11px]">
                    {f.remediation}
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
