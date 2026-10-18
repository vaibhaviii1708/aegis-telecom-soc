const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8088/api/v1';

async function fetchJson(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.detail || `HTTP Error ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.error(`API request failed [${endpoint}]:`, error);
    throw error;
  }
}

export const api = {
  // Backend Health
  async getHealth() {
    try {
      const res = await fetch('http://localhost:8088/health');
      return await res.json();
    } catch {
      return { status: 'OFFLINE' };
    }
  },

  // Dashboard
  getDashboardSummary() {
    return fetchJson('/dashboard/summary');
  },
  resetToBaseline() {
    return fetchJson('/dashboard/reset', { method: 'POST' });
  },

  // Telecom Traffic
  getDevices() {
    return fetchJson('/traffic/devices');
  },
  getTrafficEvents(params = {}) {
    const query = new URLSearchParams();
    if (params.limit) query.set('limit', params.limit);
    if (params.offset) query.set('offset', params.offset);
    if (params.risk_level) query.set('risk_level', params.risk_level);
    if (params.request_type) query.set('request_type', params.request_type);
    if (params.source_device) query.set('source_device', params.source_device);
    if (params.search) query.set('search', params.search);
    return fetchJson(`/traffic/events?${query.toString()}`);
  },
  triggerScenario(scenarioType, customDevice = null, burstIntensity = 5) {
    return fetchJson('/traffic/scenario', {
      method: 'POST',
      body: JSON.stringify({
        scenario_type: scenarioType,
        custom_device: customDevice,
        burst_intensity: burstIntensity
      })
    });
  },

  // DevSecOps Pipeline
  getPipelineLatest() {
    return fetchJson('/pipeline/latest');
  },
  getPipelineFindings(severity = 'ALL') {
    return fetchJson(`/pipeline/findings?severity=${encodeURIComponent(severity)}`);
  },
  executePipeline(branch = 'release/v1.4.0-cloud-core') {
    return fetchJson('/pipeline/execute', {
      method: 'POST',
      body: JSON.stringify({ target_branch: branch, scan_depth: 'comprehensive' })
    });
  },

  // AI Threat Detection
  getThreats(riskLevel = 'ALL') {
    return fetchJson(`/threats?risk_level=${encodeURIComponent(riskLevel)}`);
  },
  getModelInfo() {
    return fetchJson('/threats/model-info');
  },
  analyzeTelemetry(payload) {
    return fetchJson('/threats/analyze', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // Runtime Monitoring
  getRuntimeServices() {
    return fetchJson('/runtime/services');
  },
  getRuntimeTelemetry(component = 'ALL', severity = 'ALL') {
    return fetchJson(`/runtime/telemetry?component=${encodeURIComponent(component)}&severity=${encodeURIComponent(severity)}`);
  },
  getRuntimeTopology() {
    return fetchJson('/runtime/topology');
  },

  // Automated Response
  getResponseActions(riskLevel = 'ALL', actionType = 'ALL') {
    return fetchJson(`/response/actions?risk_level=${encodeURIComponent(riskLevel)}&action_type=${encodeURIComponent(actionType)}`);
  },
  releaseDevice(deviceId) {
    return fetchJson(`/response/release/${encodeURIComponent(deviceId)}`, { method: 'POST' });
  },
  manualResponseAction(payload) {
    return fetchJson('/response/execute', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // Security Reports
  getReportsSummary(filters = {}) {
    const query = new URLSearchParams();
    if (filters.risk_level) query.set('risk_level', filters.risk_level);
    if (filters.event_type) query.set('event_type', filters.event_type);
    if (filters.source_device) query.set('source_device', filters.source_device);
    return fetchJson(`/reports/summary?${query.toString()}`);
  },
  getExportCsvUrl(filters = {}) {
    const query = new URLSearchParams();
    if (filters.risk_level) query.set('risk_level', filters.risk_level);
    if (filters.source_device) query.set('source_device', filters.source_device);
    return `${API_BASE}/reports/export/csv?${query.toString()}`;
  }
};
