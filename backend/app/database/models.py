from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

def utcnow_str():
    return datetime.now(timezone.utc).isoformat()

class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(64), unique=True, index=True, nullable=False)
    device_type = Column(String(64), nullable=False)
    ip_address = Column(String(64), nullable=False)
    request_rate = Column(Float, default=0.0)
    total_requests = Column(Integer, default=0)
    risk_level = Column(String(32), default="NORMAL") # NORMAL, LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String(32), default="ACTIVE")      # ACTIVE, MONITORED, RATE_LIMITED, BLOCKED
    last_seen = Column(String(64), default=utcnow_str)

class TrafficEvent(Base):
    __tablename__ = "traffic_events"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(String(64), default=utcnow_str, index=True)
    source_device = Column(String(64), index=True, nullable=False)
    request_type = Column(String(64), index=True, nullable=False) # REGISTER_USER, AUTHENTICATE_DEVICE, VOICE_CALL, SMS_REQUEST, DATA_SESSION, API_REQUEST, HANDOVER_REQUEST
    destination_service = Column(String(64), nullable=False)
    request_rate = Column(Float, default=1.0)
    risk_score = Column(Float, default=0.0)
    classification = Column(String(32), default="NORMAL") # NORMAL, SUSPICIOUS, ANOMALY, MALICIOUS
    action = Column(String(32), default="ALLOW")           # ALLOW, FLAG_AND_MONITOR, RATE_LIMIT, BLOCK
    detection_reason = Column(String(255), default="Standard operational traffic pattern.")
    is_sample = Column(Boolean, default=False)

class ThreatDetection(Base):
    __tablename__ = "threat_detections"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(String(64), default=utcnow_str, index=True)
    source_device = Column(String(64), index=True, nullable=False)
    event_type = Column(String(64), nullable=False)
    observed_rate = Column(Float, default=0.0)
    baseline_rate = Column(Float, default=10.0)
    deviation_percent = Column(Float, default=0.0)
    failed_auth_count = Column(Integer, default=0)
    suspicious_api_count = Column(Integer, default=0)
    risk_score = Column(Float, default=0.0)
    risk_level = Column(String(32), default="LOW") # LOW, MEDIUM, HIGH, CRITICAL
    observation = Column(Text, nullable=False)
    reason = Column(Text, nullable=False)
    recommended_action = Column(Text, nullable=False)
    decision = Column(String(64), default="ALLOW") # ALLOW, RATE_LIMIT, BLOCK, CONTAIN
    status = Column(String(32), default="DETECTED") # DETECTED, MITIGATED, RESOLVED
    detection_method = Column(String(64), default="Isolation Forest (ML) + Rule Engine")

class ResponseAction(Base):
    __tablename__ = "response_actions"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(String(64), default=utcnow_str, index=True)
    threat_id = Column(Integer, nullable=True)
    source_device = Column(String(64), index=True, nullable=False)
    risk_level = Column(String(32), default="LOW")
    detection_reason = Column(Text, nullable=False)
    action_type = Column(String(64), nullable=False) # FLAG_SOURCE, APPLY_RATE_LIMIT, BLOCK_SOURCE, RELEASE_BLOCK, DISPATCH_ALERT
    policy_rule = Column(String(255), nullable=False)
    execution_status = Column(String(32), default="SUCCESS") # SUCCESS, PENDING, REVERTED
    details = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True)

class PipelineRun(Base):
    __tablename__ = "pipeline_runs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(String(64), default=utcnow_str, index=True)
    commit_hash = Column(String(32), default="a4f91e8")
    branch = Column(String(64), default="release/v1.4.0-cloud-core")
    overall_status = Column(String(32), default="PASSED") # PASSED, WARNING, FAILED
    risk_score = Column(Float, default=12.0)
    deployment_decision = Column(String(64), default="PERMITTED_TO_DEPLOY") # PERMITTED_TO_DEPLOY, DEPLOYMENT_BLOCKED
    duration_seconds = Column(Float, default=4.2)
    stages_data = Column(Text, nullable=False) # JSON encoded stage details

class PipelineFinding(Base):
    __tablename__ = "pipeline_findings"

    id = Column(Integer, primary_key=True, index=True)
    stage_name = Column(String(64), nullable=False)
    finding_type = Column(String(64), nullable=False)
    severity = Column(String(32), nullable=False) # LOW, MEDIUM, HIGH, CRITICAL
    file_path = Column(String(255), nullable=False)
    line_number = Column(Integer, default=1)
    description = Column(Text, nullable=False)
    remediation = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True)

class RuntimeService(Base):
    __tablename__ = "runtime_services"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(64), unique=True, nullable=False)
    component_type = Column(String(64), nullable=False) # INGRESS, AUTH, SESSION, API, SECURITY, RESPONSE
    operational_status = Column(String(32), default="HEALTHY") # HEALTHY, DEGRADED, ELEVATED_LOAD, ISOLATED
    request_rate = Column(Float, default=0.0)
    latency_ms = Column(Float, default=15.0)
    error_rate_percent = Column(Float, default=0.1)
    risk_level = Column(String(32), default="NORMAL")
    updated_at = Column(String(64), default=utcnow_str)

class RuntimeTelemetry(Base):
    __tablename__ = "runtime_telemetry"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(String(64), default=utcnow_str, index=True)
    component = Column(String(64), nullable=False)
    event = Column(String(128), nullable=False)
    severity = Column(String(32), default="INFO") # INFO, WARNING, ALERT, CRITICAL
    status = Column(String(32), default="NORMAL")
    details = Column(Text, nullable=False)
