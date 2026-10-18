import json
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from app.database.models import (
    Device, TrafficEvent, ThreatDetection, ResponseAction,
    PipelineRun, PipelineFinding, RuntimeService, RuntimeTelemetry
)
from app.pipeline.scanner import pipeline_scanner

def seed_database(db: Session, force: bool = False):
    """
    Populates SQLite database with a rich, coherent initial telecom dataset.
    Derived metrics, events, devices, and actions will match consistently across all views.
    """
    if not force and db.query(Device).count() > 0:
        return # Already seeded

    # Clear existing data if forced reset
    if force:
        db.query(TrafficEvent).delete()
        db.query(ThreatDetection).delete()
        db.query(ResponseAction).delete()
        db.query(PipelineFinding).delete()
        db.query(PipelineRun).delete()
        db.query(RuntimeService).delete()
        db.query(RuntimeTelemetry).delete()
        db.query(Device).delete()
        db.commit()

    base_time = datetime.now(timezone.utc) - timedelta(minutes=60)

    # 1. Devices Inventory
    devices = [
        Device(
            device_id="UE-001",
            device_type="User Equipment (5G NR)",
            ip_address="10.45.1.12",
            request_rate=4.2,
            total_requests=2450,
            risk_level="NORMAL",
            status="ACTIVE",
            last_seen=(base_time + timedelta(minutes=58)).isoformat()
        ),
        Device(
            device_id="UE-002",
            device_type="User Equipment (5G NR)",
            ip_address="10.45.1.18",
            request_rate=6.8,
            total_requests=3120,
            risk_level="NORMAL",
            status="ACTIVE",
            last_seen=(base_time + timedelta(minutes=59)).isoformat()
        ),
        Device(
            device_id="UE-014",
            device_type="User Equipment (5G Roaming)",
            ip_address="10.45.2.84",
            request_rate=44.5,
            total_requests=1890,
            risk_level="HIGH",
            status="RATE_LIMITED",
            last_seen=(base_time + timedelta(minutes=52)).isoformat()
        ),
        Device(
            device_id="IoT-Gateway-Alpha",
            device_type="Industrial IoT Gateway",
            ip_address="10.50.8.204",
            request_rate=12.1,
            total_requests=4860,
            risk_level="LOW",
            status="ACTIVE",
            last_seen=(base_time + timedelta(minutes=60)).isoformat()
        ),
        Device(
            device_id="API-Client-007",
            device_type="Partner Telematics API",
            ip_address="192.168.100.45",
            request_rate=18.4,
            total_requests=980,
            risk_level="MEDIUM",
            status="MONITORED",
            last_seen=(base_time + timedelta(minutes=56)).isoformat()
        ),
        Device(
            device_id="Botnet-Proxy-44",
            device_type="Suspicious External IP",
            ip_address="198.51.100.99",
            request_rate=98.0,
            total_requests=1240,
            risk_level="CRITICAL",
            status="BLOCKED",
            last_seen=(base_time + timedelta(minutes=48)).isoformat()
        )
    ]
    db.add_all(devices)
    db.flush()

    # 2. Runtime Microservices Architecture
    services = [
        RuntimeService(
            name="5G Ingress Gateway",
            component_type="INGRESS",
            operational_status="HEALTHY",
            request_rate=142.5,
            latency_ms=8.2,
            error_rate_percent=0.08,
            risk_level="NORMAL",
            updated_at=datetime.now(timezone.utc).isoformat()
        ),
        RuntimeService(
            name="AMF Authentication Service",
            component_type="AUTH",
            operational_status="ELEVATED_LOAD",
            request_rate=78.2,
            latency_ms=22.4,
            error_rate_percent=1.4,
            risk_level="MEDIUM",
            updated_at=datetime.now(timezone.utc).isoformat()
        ),
        RuntimeService(
            name="SMF Session Management",
            component_type="SESSION",
            operational_status="HEALTHY",
            request_rate=54.1,
            latency_ms=14.1,
            error_rate_percent=0.12,
            risk_level="NORMAL",
            updated_at=datetime.now(timezone.utc).isoformat()
        ),
        RuntimeService(
            name="Telecom Core API Service",
            component_type="API",
            operational_status="HEALTHY",
            request_rate=32.9,
            latency_ms=16.8,
            error_rate_percent=0.25,
            risk_level="NORMAL",
            updated_at=datetime.now(timezone.utc).isoformat()
        ),
        RuntimeService(
            name="AI Threat Detection Engine",
            component_type="SECURITY",
            operational_status="HEALTHY",
            request_rate=185.0,
            latency_ms=4.1,
            error_rate_percent=0.0,
            risk_level="NORMAL",
            updated_at=datetime.now(timezone.utc).isoformat()
        ),
        RuntimeService(
            name="Automated Response Engine",
            component_type="RESPONSE",
            operational_status="HEALTHY",
            request_rate=18.0,
            latency_ms=2.6,
            error_rate_percent=0.0,
            risk_level="NORMAL",
            updated_at=datetime.now(timezone.utc).isoformat()
        )
    ]
    db.add_all(services)
    db.flush()

    # 3. Traffic Events (Sample historical series: 30 events)
    events_data = [
        ("UE-001", "DATA_SESSION", "SMF Session Management", 4.1, 12.0, "NORMAL", "ALLOW", "Standard GBR bearer establishment.", 58),
        ("UE-002", "VOICE_CALL", "5G Ingress Gateway", 5.2, 14.0, "NORMAL", "ALLOW", "SIP/IMS voice channel setup.", 56),
        ("IoT-Gateway-Alpha", "DATA_SESSION", "SMF Session Management", 11.8, 15.0, "NORMAL", "ALLOW", "Telemetry batch ingestion over MQTT.", 54),
        ("UE-001", "HANDOVER_REQUEST", "5G Ingress Gateway", 3.8, 18.0, "NORMAL", "ALLOW", "Xn-based intra-frequency handover between cell-12 and cell-14.", 51),
        ("API-Client-007", "API_REQUEST", "Telecom Core API Service", 18.2, 42.0, "SUSPICIOUS", "FLAG_AND_MONITOR", "High-frequency subscriber profile queries with token renewal.", 49),
        ("Botnet-Proxy-44", "AUTHENTICATE_DEVICE", "AMF Authentication Service", 92.5, 94.0, "MALICIOUS", "BLOCK", "High-rate authentication burst exceeding maximum ingress threshold.", 48),
        ("UE-014", "AUTHENTICATE_DEVICE", "AMF Authentication Service", 46.1, 74.0, "ANOMALY", "RATE_LIMIT", "Abnormal failed authentication retries; exceeded baseline by 320%.", 46),
        ("UE-002", "SMS_REQUEST", "5G Ingress Gateway", 2.1, 10.0, "NORMAL", "ALLOW", "NAS SMS delivery protocol transfer.", 43),
        ("IoT-Gateway-Alpha", "REGISTER_USER", "AMF Authentication Service", 8.4, 20.0, "NORMAL", "ALLOW", "Periodic IoT gateway identity re-registration.", 40),
        ("UE-001", "DATA_SESSION", "SMF Session Management", 4.5, 12.0, "NORMAL", "ALLOW", "Standard high-throughput 5G data flow.", 37),
        ("API-Client-007", "API_REQUEST", "Telecom Core API Service", 16.5, 45.0, "SUSPICIOUS", "FLAG_AND_MONITOR", "Malformed query parameters probing non-exposed NEF attributes.", 35),
        ("Botnet-Proxy-44", "REGISTER_USER", "5G Ingress Gateway", 95.0, 96.0, "MALICIOUS", "BLOCK", "Automated bot connection attempt against edge proxy.", 33),
        ("UE-002", "DATA_SESSION", "SMF Session Management", 6.2, 11.0, "NORMAL", "ALLOW", "Standard bearer QoS flow #1.", 30),
        ("UE-014", "AUTHENTICATE_DEVICE", "AMF Authentication Service", 42.0, 71.0, "ANOMALY", "RATE_LIMIT", "Rate limit engaged; throttling requests to 5 req/s.", 28),
        ("IoT-Gateway-Alpha", "DATA_SESSION", "SMF Session Management", 12.5, 16.0, "NORMAL", "ALLOW", "Industrial telemetry packet stream.", 25),
        ("UE-001", "VOICE_CALL", "5G Ingress Gateway", 3.9, 13.0, "NORMAL", "ALLOW", "VoNR speech session termination.", 23),
        ("API-Client-007", "API_REQUEST", "Telecom Core API Service", 19.1, 48.0, "SUSPICIOUS", "FLAG_AND_MONITOR", "Elevated API query rate from telematics client.", 20),
        ("Botnet-Proxy-44", "API_REQUEST", "5G Ingress Gateway", 89.2, 92.0, "MALICIOUS", "BLOCK", "SYN-flood style connection attempt dropped by security proxy.", 18),
        ("UE-002", "HANDOVER_REQUEST", "5G Ingress Gateway", 4.6, 17.0, "NORMAL", "ALLOW", "N2 handover to neighboring gNodeB.", 15),
        ("UE-014", "DATA_SESSION", "SMF Session Management", 14.0, 52.0, "SUSPICIOUS", "FLAG_AND_MONITOR", "Device monitoring active post rate-limit intervention.", 12),
        ("IoT-Gateway-Alpha", "DATA_SESSION", "SMF Session Management", 11.9, 14.0, "NORMAL", "ALLOW", "Standard sensor payload transmission.", 10),
        ("UE-001", "REGISTER_USER", "AMF Authentication Service", 4.0, 11.0, "NORMAL", "ALLOW", "Periodic registration update successfully verified.", 8),
        ("UE-002", "DATA_SESSION", "SMF Session Management", 6.9, 12.0, "NORMAL", "ALLOW", "Video streaming downlink bearer active.", 6),
        ("API-Client-007", "API_REQUEST", "Telecom Core API Service", 17.8, 38.0, "SUSPICIOUS", "FLAG_AND_MONITOR", "API client operating within secondary warning band.", 4),
        ("UE-014", "AUTHENTICATE_DEVICE", "AMF Authentication Service", 39.5, 68.0, "ANOMALY", "RATE_LIMIT", "Throttle active; token challenge sent.", 2)
    ]

    for src, req_type, dst, rate, risk, cls, act, reason, min_ago in events_data:
        ev = TrafficEvent(
            timestamp=(base_time + timedelta(minutes=60 - min_ago)).isoformat(),
            source_device=src,
            request_type=req_type,
            destination_service=dst,
            request_rate=rate,
            risk_score=risk,
            classification=cls,
            action=act,
            detection_reason=reason,
            is_sample=True
        )
        db.add(ev)
    db.flush()

    # 4. Threat Detections (Coherent with events)
    threats = [
        ThreatDetection(
            timestamp=(base_time + timedelta(minutes=12)).isoformat(),
            source_device="Botnet-Proxy-44",
            event_type="DDoS-Style Volumetric Burst",
            observed_rate=98.0,
            baseline_rate=12.0,
            deviation_percent=716.7,
            failed_auth_count=18,
            suspicious_api_count=4,
            risk_score=94.5,
            risk_level="CRITICAL",
            observation="Critical volumetric burst of 98.0 req/s observed on 5G Ingress Gateway (+716.7% deviation).",
            reason="Rapid SYN flood and forged session initiation attempts saturating connection pool.",
            recommended_action="Isolate source subnet, drop ingress packets at boundary firewall, and quarantine session state.",
            decision="CONTAIN",
            status="MITIGATED",
            detection_method="Isolation Forest (ML) + Rule Engine"
        ),
        ThreatDetection(
            timestamp=(base_time + timedelta(minutes=14)).isoformat(),
            source_device="UE-014",
            event_type="Authentication Flood",
            observed_rate=46.1,
            baseline_rate=10.0,
            deviation_percent=361.0,
            failed_auth_count=12,
            suspicious_api_count=0,
            risk_score=74.0,
            risk_level="HIGH",
            observation="Rapid authentication retries (46.1 req/s) with 12 consecutive failed subscriber challenge handshakes.",
            reason="Source device exceeded the AMF auth rate ceiling by 361% with high failure ratio.",
            recommended_action="Apply progressive rate limiting (HTTP 429) and enforce exponential backoff.",
            decision="RATE_LIMIT",
            status="MITIGATED",
            detection_method="Isolation Forest (ML) + Rule Engine"
        ),
        ThreatDetection(
            timestamp=(base_time + timedelta(minutes=25)).isoformat(),
            source_device="API-Client-007",
            event_type="Suspicious API Probing",
            observed_rate=18.4,
            baseline_rate=10.0,
            deviation_percent=84.0,
            failed_auth_count=1,
            suspicious_api_count=5,
            risk_score=48.0,
            risk_level="MEDIUM",
            observation="Repeated requests with non-standard parameters targeting unexposed telecom core endpoints.",
            reason="Pattern deviation flagged by Isolation Forest; unusual API endpoint discovery behavior.",
            recommended_action="Flag device identifier for priority auditing and increase telemetry logging resolution.",
            decision="MONITOR",
            status="DETECTED",
            detection_method="Isolation Forest (ML) + Rule Engine"
        )
    ]
    db.add_all(threats)
    db.flush()

    # 5. Response Actions (Coherent with blocked/throttled devices and threats)
    responses = [
        ResponseAction(
            timestamp=(base_time + timedelta(minutes=13)).isoformat(),
            threat_id=threats[0].id,
            source_device="Botnet-Proxy-44",
            risk_level="CRITICAL",
            detection_reason="DDoS-Style Volumetric Burst exceeding ingress threshold (98.0 req/s).",
            action_type="BLOCK_SOURCE",
            policy_rule="Policy-401: Immediate Network Isolation & Bearer Teardown",
            execution_status="SUCCESS",
            details="Ingress gateway route filtered; all subsequent packets from 198.51.100.99 dropped.",
            is_active=True
        ),
        ResponseAction(
            timestamp=(base_time + timedelta(minutes=15)).isoformat(),
            threat_id=threats[1].id,
            source_device="UE-014",
            risk_level="HIGH",
            detection_reason="Authentication Flood with 12 consecutive failed handshakes.",
            action_type="APPLY_RATE_LIMIT",
            policy_rule="Policy-308: Ingress Rate-Limiting & Quota Throttling Enforced",
            execution_status="SUCCESS",
            details="Token bucket throttled to 5 req/s. Backoff challenge enforced on AMF gateway.",
            is_active=True
        ),
        ResponseAction(
            timestamp=(base_time + timedelta(minutes=26)).isoformat(),
            threat_id=threats[2].id,
            source_device="API-Client-007",
            risk_level="MEDIUM",
            detection_reason="Suspicious API Probing on core services.",
            action_type="FLAG_SOURCE",
            policy_rule="Policy-204: Elevated Telemetry Sampling & Threat Logging",
            execution_status="SUCCESS",
            details="Audit flag raised; fine-grained request tracing enabled for IP 192.168.100.45.",
            is_active=True
        )
    ]
    db.add_all(responses)
    db.flush()

    # 6. Pipeline Run and Findings (Coherent pre-deployment state)
    pipeline_res = pipeline_scanner.run_full_pipeline()
    run = PipelineRun(
        timestamp=(base_time + timedelta(minutes=5)).isoformat(),
        commit_hash=pipeline_res["commit_hash"],
        branch=pipeline_res["branch"],
        overall_status=pipeline_res["overall_status"],
        risk_score=pipeline_res["risk_score"],
        deployment_decision=pipeline_res["deployment_decision"],
        duration_seconds=pipeline_res["duration_seconds"],
        stages_data=json.dumps(pipeline_res["stages"])
    )
    db.add(run)
    db.flush()

    for f in pipeline_res["findings"]:
        finding_record = PipelineFinding(
            stage_name=f["stage_name"],
            finding_type=f["finding_type"],
            severity=f["severity"],
            file_path=f["file_path"],
            line_number=f["line_number"],
            description=f["description"],
            remediation=f["remediation"],
            is_active=True
        )
        db.add(finding_record)

    # 7. Runtime Telemetry Stream
    telemetry_logs = [
        ("5G Ingress Gateway", "TLS handshake verified for subscriber session pool", "INFO", "NORMAL", "Negotiated TLS 1.3 with AES-256-GCM cipher suite.", 55),
        ("AMF Authentication Service", "Periodic 5G-AKA authentication completed for UE-001", "INFO", "NORMAL", "Subscriber verified via 3GPP TS 33.501 vector exchange.", 50),
        ("5G Ingress Gateway", "Volumetric anomaly detected; rate spike of 98 req/s", "CRITICAL", "ISOLATED", "Botnet-Proxy-44 exceeded sliding window threshold.", 48),
        ("Automated Response Engine", "Policy-401 executed; blocked IP 198.51.100.99", "WARNING", "NORMAL", "Boundary proxy firewall rule applied.", 47),
        ("AMF Authentication Service", "Authentication flood flagged on UE-014; 12 auth errors", "WARNING", "ELEVATED_LOAD", "Token bucket rate limiter triggered.", 46),
        ("Automated Response Engine", "Policy-308 executed; applied rate limit to UE-014", "INFO", "NORMAL", "Ingress traffic shaped to 5 req/s max.", 45),
        ("Telecom Core API Service", "Endpoint probe detected on /api/v1/subscribers/internal", "WARNING", "NORMAL", "Source API-Client-007 flagged for auditing.", 35),
        ("AI Threat Detection Engine", "Isolation Forest score evaluation completed in 4.2ms", "INFO", "NORMAL", "Batch anomaly inference normal across active streams.", 10)
    ]
    for comp, evt, sev, st, det, min_ago in telemetry_logs:
        db.add(RuntimeTelemetry(
            timestamp=(base_time + timedelta(minutes=60 - min_ago)).isoformat(),
            component=comp,
            event=evt,
            severity=sev,
            status=st,
            details=det
        ))

    db.commit()
