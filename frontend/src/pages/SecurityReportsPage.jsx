import React, { useState, useEffect } from 'react';
import { 
  FileText, Download, Printer, Filter, ShieldCheck, 
  AlertTriangle, ShieldAlert, CheckCircle2, Search, ArrowDownToLine
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { api } from '../services/api';

export const SecurityReportsPage = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [eventTypeFilter, setEventTypeFilter] = useState('ALL');
  const [deviceFilter, setDeviceFilter] = useState('ALL');

  const fetchReport = async () => {
    try {
      setLoading(true);
      const data = await api.getReportsSummary({
        risk_level: riskFilter,
        event_type: eventTypeFilter,
        source_device: deviceFilter
      });
      setReportData(data);
    } catch (err) {
      console.error('Failed to load report summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [riskFilter, eventTypeFilter, deviceFilter]);

  const handleDownloadCsv = () => {
    const url = api.getExportCsvUrl({
      risk_level: riskFilter,
      source_device: deviceFilter
    });
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const threatsBySeverity = reportData?.threats_by_severity || {};
  const vulnsBySeverity = reportData?.vulnerabilities_by_severity || {};
  const events = reportData?.events || [];
  const pipeline = reportData?.latest_pipeline || {};

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Real Export Controls */}
      <div className="bg-white rounded-lg border border-slate-200/90 p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-semibold">
                Executive Audit Report
              </span>
              <span className="text-xs text-slate-400">
                Generated: {reportData?.report_generated_at ? new Date(reportData.report_generated_at).toLocaleString() : 'Just now'}
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-1">
              Telecom Cybersecurity Compliance & Audit Ledger
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive telemetry, pre-deployment gate validations, and threat mitigation audit
            </p>
          </div>

          {/* Export Action Buttons */}
          <div className="flex items-center space-x-2.5">
            <button
              onClick={handleDownloadCsv}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV Dataset</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-md text-xs font-semibold shadow-2xs flex items-center space-x-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Executive Metrics Summary Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Total Scoped Events
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {reportData?.total_events_in_scope || 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Matching active filters
          </p>
        </div>

        <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Mitigations Executed
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-600 mt-1">
            {reportData?.total_mitigations_executed || 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Policy actions logged
          </p>
        </div>

        <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Pipeline Gate Decision
          </div>
          <div className="text-xs font-bold font-mono text-slate-900 mt-2 truncate">
            {pipeline.decision || 'N/A'}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Commit: {pipeline.commit} (Risk: {pipeline.risk_score}/100)
          </p>
        </div>

        <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Critical Vulnerabilities
          </div>
          <div className="text-2xl font-bold font-mono text-rose-600 mt-1">
            {vulnsBySeverity.CRITICAL || 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Identified in pre-deploy scan
          </p>
        </div>
      </div>

      {/* 3. Severity Breakdown Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Runtime Threats by Severity */}
        <div className="p-5 bg-white rounded-lg border border-slate-200 shadow-2xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3">
            Runtime Threats by Classification
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2.5 bg-rose-50/50 border border-rose-200 rounded text-xs">
              <span className="font-semibold text-rose-900">Critical Threat Detections:</span>
              <span className="font-mono font-bold text-rose-700">{threatsBySeverity.CRITICAL || 0}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-amber-50/50 border border-amber-200 rounded text-xs">
              <span className="font-semibold text-amber-900">High Risk Anomalies:</span>
              <span className="font-mono font-bold text-amber-700">{threatsBySeverity.HIGH || 0}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-sky-50/50 border border-sky-200 rounded text-xs">
              <span className="font-semibold text-sky-900">Medium Risk Warnings:</span>
              <span className="font-mono font-bold text-sky-700">{threatsBySeverity.MEDIUM || 0}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-emerald-50/50 border border-emerald-200 rounded text-xs">
              <span className="font-semibold text-emerald-900">Low / Baseline Audits:</span>
              <span className="font-mono font-bold text-emerald-700">{threatsBySeverity.LOW || 0}</span>
            </div>
          </div>
        </div>

        {/* Pre-Deployment Flaws by Severity */}
        <div className="p-5 bg-white rounded-lg border border-slate-200 shadow-2xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3">
            Codebase Vulnerabilities by Severity
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2.5 bg-rose-50/50 border border-rose-200 rounded text-xs">
              <span className="font-semibold text-rose-900">Critical Severity Flaws (Secrets/TLS):</span>
              <span className="font-mono font-bold text-rose-700">{vulnsBySeverity.CRITICAL || 0}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-amber-50/50 border border-amber-200 rounded text-xs">
              <span className="font-semibold text-amber-900">High Severity Flaws (Weak Crypto/Deps):</span>
              <span className="font-mono font-bold text-amber-700">{vulnsBySeverity.HIGH || 0}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-sky-50/50 border border-sky-200 rounded text-xs">
              <span className="font-semibold text-sky-900">Medium Severity Flaws (Input/Expiry):</span>
              <span className="font-mono font-bold text-sky-700">{vulnsBySeverity.MEDIUM || 0}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded text-xs">
              <span className="font-semibold text-slate-800">Low / Informational Findings:</span>
              <span className="font-mono font-bold text-slate-700">{vulnsBySeverity.LOW || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Filterable Scoped Events Ledger Table */}
      <div className="bg-white rounded-lg border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Audit Event Log (Scoped Records)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Filtered telemetry records exported in CSV format
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="py-1 px-2.5 border border-slate-300 rounded bg-white text-xs"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="NORMAL">Normal</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High / Critical</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider sticky top-0 z-10">
              <tr>
                <th className="py-2 px-4">Event ID</th>
                <th className="py-2 px-4">Timestamp (UTC)</th>
                <th className="py-2 px-4">Source Device</th>
                <th className="py-2 px-4">Request Type</th>
                <th className="py-2 px-4">Destination Service</th>
                <th className="py-2 px-4">Rate (req/s)</th>
                <th className="py-2 px-4">Risk Score</th>
                <th className="py-2 px-4">Classification</th>
                <th className="py-2 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {events.map((ev) => (
                <tr key={ev.id} className="hover:bg-slate-50">
                  <td className="py-2 px-4 text-slate-400">#{ev.id}</td>
                  <td className="py-2 px-4 text-slate-500 whitespace-nowrap">
                    {new Date(ev.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2 px-4 font-bold text-slate-900">{ev.source_device}</td>
                  <td className="py-2 px-4 font-sans text-slate-700">{ev.request_type}</td>
                  <td className="py-2 px-4 font-sans text-slate-700">{ev.destination_service}</td>
                  <td className="py-2 px-4 text-slate-800">{ev.request_rate}</td>
                  <td className="py-2 px-4 font-bold text-slate-900">{ev.risk_score}</td>
                  <td className="py-2 px-4 font-sans">
                    <Badge variant={ev.classification} size="xs">
                      {ev.classification}
                    </Badge>
                  </td>
                  <td className="py-2 px-4 font-sans">
                    <Badge variant={ev.action} size="xs">
                      {ev.action}
                    </Badge>
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
