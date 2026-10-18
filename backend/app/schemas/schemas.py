from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

# Device Schemas
class DeviceBase(BaseModel):
    device_id: str
    device_type: str
    ip_address: str
    request_rate: float
    total_requests: int
    risk_level: str
    status: str
    last_seen: str

class DeviceOut(DeviceBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# Traffic Event Schemas
class TrafficEventBase(BaseModel):
    timestamp: str
    source_device: str
    request_type: str
    destination_service: str
    request_rate: float
    risk_score: float
    classification: str
    action: str
    detection_reason: str
    is_sample: bool = False

class TrafficEventOut(TrafficEventBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class ScenarioRequest(BaseModel):
    scenario_type: str # "NORMAL_TRAFFIC", "AUTH_FLOOD", "SUSPICIOUS_API", "DDOS_BURST"
    custom_device: Optional[str] = None
    burst_intensity: Optional[int] = Field(default=5, ge=1, le=20)

# Threat Detection Schemas
class ThreatDetectionBase(BaseModel):
    timestamp: str
    source_device: str
    event_type: str
    observed_rate: float
    baseline_rate: float
    deviation_percent: float
    failed_auth_count: int
    suspicious_api_count: int
    risk_score: float
    risk_level: str
    observation: str
    reason: str
    recommended_action: str
    decision: str
    status: str
    detection_method: str

class ThreatDetectionOut(ThreatDetectionBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# Response Action Schemas
class ResponseActionBase(BaseModel):
    timestamp: str
    threat_id: Optional[int] = None
    source_device: str
    risk_level: str
    detection_reason: str
    action_type: str
    policy_rule: str
    execution_status: str
    details: str
    is_active: bool = True

class ResponseActionOut(ResponseActionBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class ResponseActionCreate(BaseModel):
    source_device: str
    action_type: str # "FLAG_SOURCE", "APPLY_RATE_LIMIT", "BLOCK_SOURCE", "RELEASE_BLOCK"
    reason: Optional[str] = "Manual operator intervention from SOC console."

# Pipeline Schemas
class PipelineFindingOut(BaseModel):
    id: int
    stage_name: str
    finding_type: str
    severity: str
    file_path: str
    line_number: int
    description: str
    remediation: str
    is_active: bool
    model_config = ConfigDict(from_attributes=True)

class PipelineStageSummary(BaseModel):
    id: str
    name: str
    status: str # PASSED, WARNING, FAILED, RUNNING, NOT_STARTED
    duration_ms: int
    findings_count: int
    explanation: str

class PipelineRunOut(BaseModel):
    id: int
    timestamp: str
    commit_hash: str
    branch: str
    overall_status: str
    risk_score: float
    deployment_decision: str
    duration_seconds: float
    stages: List[PipelineStageSummary]
    findings: List[PipelineFindingOut] = []
    model_config = ConfigDict(from_attributes=True)

class PipelineRunRequest(BaseModel):
    target_branch: Optional[str] = "release/v1.4.0-cloud-core"
    scan_depth: Optional[str] = "comprehensive" # "fast", "comprehensive"

# Runtime Monitoring Schemas
class RuntimeServiceOut(BaseModel):
    id: int
    name: str
    component_type: str
    operational_status: str
    request_rate: float
    latency_ms: float
    error_rate_percent: float
    risk_level: str
    updated_at: str
    model_config = ConfigDict(from_attributes=True)

class RuntimeTelemetryOut(BaseModel):
    id: int
    timestamp: str
    component: str
    event: str
    severity: str
    status: str
    details: str
    model_config = ConfigDict(from_attributes=True)

# Dashboard Summary Schema
class DashboardSummaryOut(BaseModel):
    system_status: str # "OPERATIONAL", "ELEVATED RISK", "CRITICAL ALERT"
    security_posture: str # "OPTIMAL", "GUARDED", "ELEVATED RISK", "UNDER ATTACK"
    posture_score: float # 0 - 100
    backend_status: str # "CONNECTED"
    last_updated: str
    metrics: Dict[str, Any]
    traffic_time_series: List[Dict[str, Any]]
    risk_distribution: List[Dict[str, Any]]
    recent_events: List[TrafficEventOut]
    lifecycle_stages: List[Dict[str, Any]]

# Threat Analysis Request
class ThreatAnalysisRequest(BaseModel):
    source_device: str
    request_rate: float
    request_type: str
    failed_auth_count: int = 0
    suspicious_api_count: int = 0
