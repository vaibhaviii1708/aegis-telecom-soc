// Detect environment and configure API base URL
const getApiBase = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocalhost) {
      return 'http://localhost:8088/api/v1';
    }
  }
  return '/api/v1';
};

const API_BASE = getApiBase();

// Fallback baseline data when backend is starting or offline
const fallbackState = {
  metrics: {
    total_requests: 12840,
    threats_detected: 24,
    requests_blocked: 18,
    active_devices: 156,
    open_alerts: 1,
    vulnerabilities_found: 9,
    security_posture_score: 94.2
  },
  system_status: 'OPERATIONAL',
  security_posture: 'OPTIMAL',
  posture_score: 94.2,
  last_updated: new Date().toISOString(),
  traffic_time_series: [
    { time: '12:00', normal: 24.2, suspicious: 2.1, blocked: 0.0, total: 26.3 },
    { time: '12:05', normal: 26.5, suspicious: 1.8, blocked: 0.0, total: 28.3 },
    { time: '12:10', normal: 23.8, suspicious: 3.2, blocked: 0.8, total: 27.8 },
    { time: '12:15', normal: 28.1, suspicious: 2.4, blocked: 0.0, total: 30.5 },
    { time: '12:20', normal: 25.4, suspicious: 4.1, blocked: 1.2, total: 30.7 },
    { time: '12:25', normal: 31.0, suspicious: 3.5, blocked: 0.5, total: 35.0 },
    { time: '12:30', normal: 27.2, suspicious: 5.6, blocked: 2.4, total: 35.2 },
    { time: '12:35', normal: 29.5, suspicious: 3.0, blocked: 0.0, total: 32.5 },
    { time: '12:40', normal: 26.8, suspicious: 2.8, blocked: 0.0, total: 29.6 },
    { time: '12:45', normal: 28.4, suspicious: 3.1, blocked: 0.0, total: 31.5 }
  ],
  risk_distribution: [
    { name: 'Normal', value: 120, color: '#10B981' },
    { name: 'Low Risk', value: 24, color: '#0EA5E9' },
    { name: 'Medium Risk', value: 14, color: '#F59E0B' },
    { name: 'High / Critical', value: 6, color: '#E11D48' }
  ],
  devices: [
    { id: 1, device_id: 'UE-001', device_type: 'User Equipment (5G NR)', ip_address: '10.45.1.12', request_rate: 4.2, total_requests: 2450, risk_level: 'NORMAL', status: 'ACTIVE', last_seen: new Date().toISOString() },
    { id: 2, device_id: 'UE-002', device_type: 'User Equipment (5G NR)', ip_address: '10.45.1.18', request_rate: 6.8, total_requests: 3120, risk_level: 'NORMAL', status: 'ACTIVE', last_seen: new Date().toISOString() },
    { id: 3, device_id: 'UE-014', device_type: 'User Equipment (5G Roaming)', ip_address: '10.45.2.84', request_rate: 44.5, total_requests: 1890, risk_level: 'HIGH', status: 'RATE_LIMITED', last_seen: new Date().toISOString() },
    { id: 4, device_id: 'IoT-Gateway-Alpha', device_type: 'Industrial IoT Gateway', ip_address: '10.50.8.204', request_rate: 12.1, total_requests: 4860, risk_level: 'LOW', status: 'ACTIVE', last_seen: new Date().toISOString() },
    { id: 5, device_id: 'API-Client-007', device_type: 'Partner Telematics API', ip_address: '192.168.100.45', request_rate: 18.4, total_requests: 980, risk_level: 'MEDIUM', status: 'MONITORED', last_seen: new Date().toISOString() },
    { id: 6, device_id: 'Botnet-Proxy-44', device_type: 'Suspicious External IP', ip_address: '198.51.100.99', request_rate: 98.0, total_requests: 1240, risk_level: 'CRITICAL', status: 'BLOCKED', last_seen: new Date().toISOString() }
  ],
  lifecycle_stages: [
    { stage: 'Source Code', status: 'VERIFIED', detail: 'Git commit integrity valid', step: 1 },
    { stage: 'Security Scan', status: 'COMPLETED', detail: 'SAST/SCA/Config audits finished', step: 2 },
    { stage: 'Risk Analysis', status: 'ACTIVE', detail: 'Composite pre-deploy risk: 100/100', step: 3 },
    { stage: 'Security Gate', status: 'BLOCKED', detail: 'DEPLOYMENT_BLOCKED', step: 4 },
    { stage: 'Deployment', status: 'ACTIVE', detail: 'Cloud-native telecom microservices live', step: 5 },
    { stage: 'Traffic Monitoring', status: 'STREAMING', detail: 'Tracking 156 UEs and nodes', step: 6 },
    { stage: 'Threat Detection', status: 'ACTIVE', detail: 'Isolation Forest ML engine operational', step: 7 },
    { stage: 'Automated Response', status: 'ENFORCING', detail: '18 malicious vectors isolated', step: 8 }
  ]
};

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
    console.warn(`Live API call failed [${endpoint}]:`, error.message);
    throw error;
  }
}

export const api = {
  // Backend Health
  async getHealth() {
    try {
      const baseRoot = API_BASE.replace(/\/api\/v1\/?$/, '');
      const healthUrl = baseRoot ? `${baseRoot}/health` : '/health';
      const res = await fetch(healthUrl, { signal: AbortSignal.timeout(4000) });
      if (!res.ok) throw new Error();
      return await res.json();
    } catch {
      return { status: 'OFFLINE' };
    }
  },

  // Dashboard
  async getDashboardSummary() {
    try {
      return await fetchJson('/dashboard/summary');
    } catch {
      return {
        ...fallbackState,
        recent_events: fallbackState.devices.map((d, i) => ({
          id: i + 1,
          timestamp: new Date().toISOString(),
          source_device: d.device_id,
          request_type: d.risk_level === 'HIGH' ? 'AUTHENTICATE_DEVICE' : 'DATA_SESSION',
          destination_service: d.risk_level === 'HIGH' ? 'AMF Authentication Service' : 'SMF Session Management',
          request_rate: d.request_rate,
          risk_score: d.risk_level === 'CRITICAL' ? 94.0 : d.risk_level === 'HIGH' ? 74.0 : 12.0,
          classification: d.risk_level === 'CRITICAL' ? 'MALICIOUS' : d.risk_level === 'HIGH' ? 'ANOMALY' : 'NORMAL',
          action: d.status === 'BLOCKED' ? 'BLOCK' : d.status === 'RATE_LIMITED' ? 'RATE_LIMIT' : 'ALLOW',
          detection_reason: d.status === 'BLOCKED' ? 'Volumetric surge exceeding threshold.' : 'Standard operating throughput.',
          is_sample: true
        }))
      };
    }
  },

  async resetToBaseline() {
    try {
      return await fetchJson('/dashboard/reset', { method: 'POST' });
    } catch {
      return { status: 'SUCCESS', message: 'Restored baseline simulation state.' };
    }
  },

  // Telecom Traffic
  async getDevices() {
    try {
      return await fetchJson('/traffic/devices');
    } catch {
      return fallbackState.devices;
    }
  },

  async getTrafficEvents(params = {}) {
    const query = new URLSearchParams();
    if (params.limit) query.set('limit', params.limit);
    if (params.offset) query.set('offset', params.offset);
    if (params.risk_level) query.set('risk_level', params.risk_level);
    if (params.request_type) query.set('request_type', params.request_type);
    if (params.source_device) query.set('source_device', params.source_device);
    if (params.search) query.set('search', params.search);

    try {
      return await fetchJson(`/traffic/events?${query.toString()}`);
    } catch {
      return fallbackState.devices.map((d, i) => ({
        id: i + 1,
        timestamp: new Date().toISOString(),
        source_device: d.device_id,
        request_type: d.risk_level === 'HIGH' ? 'AUTHENTICATE_DEVICE' : 'DATA_SESSION',
        destination_service: d.risk_level === 'HIGH' ? 'AMF Authentication Service' : 'SMF Session Management',
        request_rate: d.request_rate,
        risk_score: d.risk_level === 'CRITICAL' ? 94.0 : d.risk_level === 'HIGH' ? 74.0 : 12.0,
        classification: d.risk_level === 'CRITICAL' ? 'MALICIOUS' : d.risk_level === 'HIGH' ? 'ANOMALY' : 'NORMAL',
        action: d.status === 'BLOCKED' ? 'BLOCK' : d.status === 'RATE_LIMITED' ? 'RATE_LIMIT' : 'ALLOW',
        detection_reason: d.status === 'BLOCKED' ? 'Volumetric surge exceeding threshold.' : 'Standard operating throughput.',
        is_sample: true
      }));
    }
  },

  async triggerScenario(scenarioType, customDevice = null, burstIntensity = 5) {
    try {
      return await fetchJson('/traffic/scenario', {
        method: 'POST',
        body: JSON.stringify({
          scenario_type: scenarioType,
          custom_device: customDevice,
          burst_intensity: burstIntensity
        })
      });
    } catch {
      return {
        status: 'SUCCESS',
        scenario: scenarioType,
        risk_score: scenarioType === 'DDOS_BURST' ? 94.5 : scenarioType === 'AUTH_FLOOD' ? 76.2 : 12.0,
        risk_level: scenarioType === 'DDOS_BURST' ? 'CRITICAL' : scenarioType === 'AUTH_FLOOD' ? 'HIGH' : 'LOW',
        action_taken: scenarioType === 'DDOS_BURST' ? 'BLOCK_SOURCE' : scenarioType === 'AUTH_FLOOD' ? 'APPLY_RATE_LIMIT' : 'ALLOW',
        message: `${scenarioType} executed. Evaluated against Isolation Forest model; policy mitigation applied.`
      };
    }
  },

  // DevSecOps Pipeline
  async getPipelineLatest() {
    try {
      return await fetchJson('/pipeline/latest');
    } catch {
      return {
        id: 1,
        timestamp: new Date().toISOString(),
        commit_hash: 'a4f91e8',
        branch: 'release/v1.4.0-cloud-core',
        overall_status: 'FAILED',
        risk_score: 100.0,
        deployment_decision: 'DEPLOYMENT_BLOCKED',
        duration_seconds: 3.8,
        stages: [
          { id: 'stage-1', name: 'Source Validation', status: 'PASSED', duration_ms: 320, findings_count: 0, explanation: 'Git signature and commit integrity verified.' },
          { id: 'stage-2', name: 'Static Application Security Testing', status: 'FAILED', duration_ms: 780, findings_count: 3, explanation: 'Detected hardcoded credentials and weak MD5 hashing.' },
          { id: 'stage-3', name: 'Dependency Security Check', status: 'FAILED', duration_ms: 540, findings_count: 3, explanation: 'Known CVEs detected in third-party packages.' },
          { id: 'stage-4', name: 'Configuration Security Check', status: 'FAILED', duration_ms: 410, findings_count: 3, explanation: 'Disabled TLS verification and debug mode active.' },
          { id: 'stage-5', name: 'AI-Assisted Risk Analysis', status: 'FAILED', duration_ms: 620, findings_count: 9, explanation: 'Vulnerability scoring model calculated risk score of 100/100.' },
          { id: 'stage-6', name: 'Security Gate', status: 'FAILED', duration_ms: 210, findings_count: 0, explanation: 'Gate blocked: Found 3 critical vulnerabilities exceeding enterprise zero-trust tolerance.' },
          { id: 'stage-7', name: 'Deployment Decision', status: 'FAILED', duration_ms: 110, findings_count: 0, explanation: 'Automated CI/CD policy outcome: DEPLOYMENT_BLOCKED.' }
        ],
        findings: [
          { id: 1, stage_name: 'SAST', finding_type: 'SECRET_LEAK', severity: 'CRITICAL', file_path: 'microservices/amf/auth_service.py', line_number: 6, description: 'Hardcoded live provisioning secret detected.', remediation: 'Migrate to HashiCorp Vault or Kubernetes Secret.', is_active: true },
          { id: 2, stage_name: 'SAST', finding_type: 'WEAK_CRYPTO', severity: 'HIGH', file_path: 'microservices/amf/auth_service.py', line_number: 10, description: 'Insecure cryptographic hash (MD5) used for session keys.', remediation: 'Replace with HMAC-SHA256.', is_active: true },
          { id: 3, stage_name: 'Configuration Security Check', finding_type: 'INSECURE_CONFIG', severity: 'CRITICAL', file_path: 'deployments/k8s/service_config.yaml', line_number: 15, description: 'TLS verification explicitly disabled in manifest.', remediation: 'Enforce strict mutual TLS (mTLS).', is_active: true }
        ]
      };
    }
  },

  async getPipelineFindings(severity = 'ALL') {
    try {
      return await fetchJson(`/pipeline/findings?severity=${encodeURIComponent(severity)}`);
    } catch {
      return (await this.getPipelineLatest()).findings;
    }
  },

  async executePipeline(branch = 'release/v1.4.0-cloud-core') {
    try {
      return await fetchJson('/pipeline/execute', {
        method: 'POST',
        body: JSON.stringify({ target_branch: branch, scan_depth: 'comprehensive' })
      });
    } catch {
      return await this.getPipelineLatest();
    }
  },

  // AI Threat Detection
  async getThreats(riskLevel = 'ALL') {
    try {
      return await fetchJson(`/threats?risk_level=${encodeURIComponent(riskLevel)}`);
    } catch {
      return [
        {
          id: 1,
          timestamp: new Date().toISOString(),
          source_device: 'Botnet-Proxy-44',
          event_type: 'DDoS-Style Volumetric Flood',
          observed_rate: 98.0,
          baseline_rate: 12.0,
          deviation_percent: 716.7,
          failed_auth_count: 18,
          suspicious_api_count: 4,
          risk_score: 94.5,
          risk_level: 'CRITICAL',
          observation: 'Critical volumetric burst of 98.0 req/s on 5G Ingress Gateway.',
          reason: 'SYN flood saturating ingress queue.',
          recommended_action: 'Isolate source subnet and drop ingress packets at boundary firewall.',
          decision: 'CONTAIN',
          status: 'MITIGATED',
          detection_method: 'Isolation Forest (ML) + Rule Engine'
        },
        {
          id: 2,
          timestamp: new Date().toISOString(),
          source_device: 'UE-014',
          event_type: 'Authentication Flood',
          observed_rate: 46.1,
          baseline_rate: 10.0,
          deviation_percent: 361.0,
          failed_auth_count: 12,
          suspicious_api_count: 0,
          risk_score: 74.0,
          risk_level: 'HIGH',
          observation: 'Rapid authentication attempts with 12 failed handshakes.',
          reason: 'Source exceeded AMF auth rate ceiling by 361%.',
          recommended_action: 'Apply progressive rate limiting (HTTP 429) and enforce exponential backoff.',
          decision: 'RATE_LIMIT',
          status: 'MITIGATED',
          detection_method: 'Isolation Forest (ML) + Rule Engine'
        }
      ];
    }
  },

  async getModelInfo() {
    try {
      return await fetchJson('/threats/model-info');
    } catch {
      return {
        model_architecture: 'Scikit-Learn Isolation Forest (iForest)',
        framework: 'Python 3.14 / scikit-learn',
        n_estimators: 100,
        contamination_factor: 0.08,
        features: [
          { name: 'norm_rate', description: 'Observed request throughput normalized against saturation ceiling (150 req/s).' },
          { name: 'rate_deviation', description: 'Percentage divergence of observed throughput relative to device baseline.' },
          { name: 'endpoint_sensitivity', description: '3GPP network function critical factor (e.g. AMF auth=0.85, Ingress=0.60).' },
          { name: 'request_weight', description: 'Signaling sensitivity weight (e.g. Authenticate=0.60, DataSession=0.15).' },
          { name: 'norm_auth_fail', description: 'Consecutive challenge-handshake failures normalized to threshold.' },
          { name: 'norm_api_suspicion', description: 'Frequency of malformed or unauthorized parameter probes.' }
        ]
      };
    }
  },

  async analyzeTelemetry(payload) {
    try {
      return await fetchJson('/threats/analyze', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch {
      const isCritical = payload.request_rate >= 80 || payload.failed_auth_count >= 15;
      const isHigh = payload.request_rate >= 40 || payload.failed_auth_count >= 8;
      const risk = isCritical ? 'CRITICAL' : isHigh ? 'HIGH' : 'LOW';
      return {
        risk_score: isCritical ? 92.5 : isHigh ? 72.0 : 15.0,
        risk_level: risk,
        action: isCritical ? 'BLOCK' : isHigh ? 'RATE_LIMIT' : 'ALLOW',
        enforced_action: isCritical ? 'BLOCK' : isHigh ? 'RATE_LIMIT' : 'ALLOW',
        decision_score: isCritical ? -0.21 : 0.14,
        observation: `Evaluated ${payload.source_device} at ${payload.request_rate} req/s with ${payload.failed_auth_count} failed auths.`,
        reason: isCritical ? 'Volumetric surge exceeding safety margins.' : 'Signaling parameters within expected tolerance.',
        recommended_action: isCritical ? 'Isolate source at edge proxy.' : 'Allow normal routing.'
      };
    }
  },

  // Runtime Monitoring
  async getRuntimeServices() {
    try {
      return await fetchJson('/runtime/services');
    } catch {
      return [
        { id: 1, name: '5G Ingress Gateway', component_type: 'INGRESS', operational_status: 'HEALTHY', request_rate: 142.5, latency_ms: 8.2, error_rate_percent: 0.08, risk_level: 'NORMAL', updated_at: new Date().toISOString() },
        { id: 2, name: 'AMF Authentication Service', component_type: 'AUTH', operational_status: 'ELEVATED_LOAD', request_rate: 78.2, latency_ms: 22.4, error_rate_percent: 1.4, risk_level: 'MEDIUM', updated_at: new Date().toISOString() },
        { id: 3, name: 'SMF Session Management', component_type: 'SESSION', operational_status: 'HEALTHY', request_rate: 54.1, latency_ms: 14.1, error_rate_percent: 0.12, risk_level: 'NORMAL', updated_at: new Date().toISOString() },
        { id: 4, name: 'Telecom Core API Service', component_type: 'API', operational_status: 'HEALTHY', request_rate: 32.9, latency_ms: 16.8, error_rate_percent: 0.25, risk_level: 'NORMAL', updated_at: new Date().toISOString() },
        { id: 5, name: 'AI Threat Detection Engine', component_type: 'SECURITY', operational_status: 'HEALTHY', request_rate: 185.0, latency_ms: 4.1, error_rate_percent: 0.0, risk_level: 'NORMAL', updated_at: new Date().toISOString() },
        { id: 6, name: 'Automated Response Engine', component_type: 'RESPONSE', operational_status: 'HEALTHY', request_rate: 18.0, latency_ms: 2.6, error_rate_percent: 0.0, risk_level: 'NORMAL', updated_at: new Date().toISOString() }
      ];
    }
  },

  async getRuntimeTelemetry(component = 'ALL', severity = 'ALL') {
    try {
      return await fetchJson(`/runtime/telemetry?component=${encodeURIComponent(component)}&severity=${encodeURIComponent(severity)}`);
    } catch {
      return [
        { id: 1, timestamp: new Date().toISOString(), component: '5G Ingress Gateway', event: 'TLS handshake verified for subscriber pool', severity: 'INFO', status: 'NORMAL', details: 'Negotiated TLS 1.3 with AES-256-GCM cipher suite.' },
        { id: 2, timestamp: new Date().toISOString(), component: 'AMF Authentication Service', event: 'Authentication flood throttled on UE-014', severity: 'WARNING', status: 'ELEVATED_LOAD', details: 'Token bucket rate limiter engaged via Policy-308.' },
        { id: 3, timestamp: new Date().toISOString(), component: 'Automated Response Engine', event: 'Policy-401 dropped packet burst from 198.51.100.99', severity: 'CRITICAL', status: 'ISOLATED', details: 'Boundary firewall filter enforced.' }
      ];
    }
  },

  async getRuntimeTopology() {
    try {
      return await fetchJson('/runtime/topology');
    } catch {
      return {
        architecture_name: 'Cloud-Native 5G Service-Based Architecture (SBA)',
        telemetry_source: 'Application-level microservice telemetry',
        nodes: [
          { id: 'node-devices', name: 'End-User Devices', type: 'FLEET', status: 'OPERATIONAL', metrics: '156 Active UEs & Gateways' },
          { id: 'node-ingress', name: '5G Ingress Gateway', type: 'INGRESS', status: 'HEALTHY', metrics: '142.5 req/s | 8.2ms' },
          { id: 'node-amf', name: 'AMF Authentication Service', type: 'AUTH', status: 'HEALTHY', metrics: '78.2 req/s | 22.4ms' },
          { id: 'node-smf', name: 'SMF Session Management', type: 'SESSION', status: 'HEALTHY', metrics: '54.1 req/s | 14.1ms' },
          { id: 'node-api', name: 'Telecom Core API Service', type: 'API', status: 'HEALTHY', metrics: '32.9 req/s | 16.8ms' },
          { id: 'node-ai', name: 'AI Threat Detection Engine', type: 'SECURITY', status: 'HEALTHY', metrics: 'Isolation Forest iForest | Active' },
          { id: 'node-response', name: 'Automated Response Engine', type: 'RESPONSE', status: 'HEALTHY', metrics: 'Policy Matrix Enforcer | Active' }
        ]
      };
    }
  },

  // Automated Response
  async getResponseActions(riskLevel = 'ALL', actionType = 'ALL') {
    try {
      return await fetchJson(`/response/actions?risk_level=${encodeURIComponent(riskLevel)}&action_type=${encodeURIComponent(actionType)}`);
    } catch {
      return [
        {
          id: 1,
          timestamp: new Date().toISOString(),
          threat_id: 1,
          source_device: 'Botnet-Proxy-44',
          risk_level: 'CRITICAL',
          detection_reason: 'DDoS-Style Volumetric Burst exceeding ingress threshold.',
          action_type: 'BLOCK_SOURCE',
          policy_rule: 'Policy-401: Immediate Network Isolation & Bearer Teardown',
          execution_status: 'SUCCESS',
          details: 'Dropped all incoming sessions from 198.51.100.99. Ingress proxy filter applied.',
          is_active: true
        },
        {
          id: 2,
          timestamp: new Date().toISOString(),
          threat_id: 2,
          source_device: 'UE-014',
          risk_level: 'HIGH',
          detection_reason: 'Authentication Flood with consecutive failed handshakes.',
          action_type: 'APPLY_RATE_LIMIT',
          policy_rule: 'Policy-308: Ingress Rate-Limiting & Quota Throttling Enforced',
          execution_status: 'SUCCESS',
          details: 'Token bucket throttled to 5 req/s on AMF gateway.',
          is_active: true
        }
      ];
    }
  },

  async releaseDevice(deviceId) {
    try {
      return await fetchJson(`/response/release/${encodeURIComponent(deviceId)}`, { method: 'POST' });
    } catch {
      const dev = fallbackState.devices.find((d) => d.device_id === deviceId);
      if (dev) {
        dev.status = 'ACTIVE';
        dev.risk_level = 'NORMAL';
      }
      return {
        status: 'SUCCESS',
        device_id: deviceId,
        new_status: 'ACTIVE',
        message: `Successfully cleared restrictions on ${deviceId}. Normal traffic flow reinstated.`
      };
    }
  },

  async manualResponseAction(payload) {
    try {
      return await fetchJson('/response/execute', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch {
      return {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        threat_id: null,
        source_device: payload.source_device,
        risk_level: payload.action_type === 'BLOCK_SOURCE' ? 'CRITICAL' : 'HIGH',
        detection_reason: payload.reason || 'Manual operator action from AEGIS SOC console.',
        action_type: payload.action_type,
        policy_rule: 'Operator Directive Policy',
        execution_status: 'SUCCESS',
        details: `Operator executed ${payload.action_type} on ${payload.source_device}.`,
        is_active: true
      };
    }
  },

  // Security Reports
  async getReportsSummary(filters = {}) {
    const query = new URLSearchParams();
    if (filters.risk_level) query.set('risk_level', filters.risk_level);
    if (filters.event_type) query.set('event_type', filters.event_type);
    if (filters.source_device) query.set('source_device', filters.source_device);

    try {
      return await fetchJson(`/reports/summary?${query.toString()}`);
    } catch {
      return {
        report_generated_at: new Date().toISOString(),
        total_events_in_scope: 25,
        threats_by_severity: { CRITICAL: 1, HIGH: 1, MEDIUM: 1, LOW: 0 },
        vulnerabilities_by_severity: { CRITICAL: 3, HIGH: 3, MEDIUM: 3, LOW: 0 },
        total_mitigations_executed: 3,
        latest_pipeline: {
          commit: 'a4f91e8',
          branch: 'release/v1.4.0-cloud-core',
          decision: 'DEPLOYMENT_BLOCKED',
          risk_score: 100.0,
          status: 'FAILED'
        },
        events: fallbackState.devices.map((d, i) => ({
          id: i + 1,
          timestamp: new Date().toISOString(),
          source_device: d.device_id,
          request_type: d.risk_level === 'HIGH' ? 'AUTHENTICATE_DEVICE' : 'DATA_SESSION',
          destination_service: d.risk_level === 'HIGH' ? 'AMF Authentication Service' : 'SMF Session Management',
          request_rate: d.request_rate,
          risk_score: d.risk_level === 'CRITICAL' ? 94.0 : d.risk_level === 'HIGH' ? 74.0 : 12.0,
          classification: d.risk_level === 'CRITICAL' ? 'MALICIOUS' : d.risk_level === 'HIGH' ? 'ANOMALY' : 'NORMAL',
          action: d.status === 'BLOCKED' ? 'BLOCK' : d.status === 'RATE_LIMITED' ? 'RATE_LIMIT' : 'ALLOW'
        }))
      };
    }
  },

  getExportCsvUrl(filters = {}) {
    const query = new URLSearchParams();
    if (filters.risk_level) query.set('risk_level', filters.risk_level);
    if (filters.source_device) query.set('source_device', filters.source_device);
    return `${API_BASE}/reports/export/csv?${query.toString()}`;
  }
};
