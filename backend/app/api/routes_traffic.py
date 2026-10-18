import random
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database.session import get_db
from app.database.models import (
    Device, TrafficEvent, ThreatDetection, ResponseAction, RuntimeTelemetry, RuntimeService
)
from app.schemas.schemas import DeviceOut, TrafficEventOut, ScenarioRequest
from app.detection.rules_engine import rules_engine

router = APIRouter(prefix="/traffic", tags=["Telecom Traffic"])

@router.get("/devices", response_model=List[DeviceOut])
def get_devices(db: Session = Depends(get_db)):
    devices = db.query(Device).order_by(Device.device_id).all()
    return [DeviceOut.model_validate(d) for d in devices]

@router.get("/events", response_model=List[TrafficEventOut])
def get_traffic_events(
    db: Session = Depends(get_db),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    risk_level: Optional[str] = None,
    request_type: Optional[str] = None,
    source_device: Optional[str] = None,
    search: Optional[str] = None
):
    query = db.query(TrafficEvent)
    
    if risk_level and risk_level != "ALL":
        if risk_level == "NORMAL":
            query = query.filter(TrafficEvent.classification == "NORMAL")
        elif risk_level == "LOW":
            query = query.filter(TrafficEvent.risk_score <= 35.0, TrafficEvent.classification != "NORMAL")
        elif risk_level == "MEDIUM":
            query = query.filter(TrafficEvent.classification == "SUSPICIOUS")
        elif risk_level in ["HIGH", "CRITICAL"]:
            query = query.filter(TrafficEvent.classification.in_(["ANOMALY", "MALICIOUS"]))

    if request_type and request_type != "ALL":
        query = query.filter(TrafficEvent.request_type == request_type)

    if source_device and source_device != "ALL":
        query = query.filter(TrafficEvent.source_device == source_device)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (TrafficEvent.source_device.ilike(search_pattern)) |
            (TrafficEvent.destination_service.ilike(search_pattern)) |
            (TrafficEvent.detection_reason.ilike(search_pattern)) |
            (TrafficEvent.request_type.ilike(search_pattern))
        )

    events = query.order_by(desc(TrafficEvent.timestamp)).offset(offset).limit(limit).all()
    return [TrafficEventOut.model_validate(e) for e in events]

@router.post("/scenario")
def trigger_scenario(payload: ScenarioRequest, db: Session = Depends(get_db)):
    """
    Executes a deterministic traffic scenario, generating correlated events,
    triggering AI threat analysis, and executing automated containment actions.
    """
    scenario = payload.scenario_type
    now = datetime.now(timezone.utc)
    generated_events = []

    if scenario == "NORMAL_TRAFFIC":
        sources = ["UE-001", "UE-002", "IoT-Gateway-Alpha"]
        req_types = ["DATA_SESSION", "VOICE_CALL", "REGISTER_USER"]
        
        for i in range(payload.burst_intensity):
            src = random.choice(sources)
            req_type = random.choice(req_types)
            dest = "SMF Session Management" if req_type == "DATA_SESSION" else "5G Ingress Gateway"
            rate = round(random.uniform(3.5, 9.8), 1)

            eval_res = rules_engine.evaluate(
                source_device=src,
                observed_rate=rate,
                baseline_rate=8.0,
                destination_service=dest,
                request_type=req_type
            )

            ev = TrafficEvent(
                timestamp=(now + timedelta(seconds=i * 2)).isoformat(),
                source_device=src,
                request_type=req_type,
                destination_service=dest,
                request_rate=rate,
                risk_score=eval_res["risk_score"],
                classification="NORMAL",
                action="ALLOW",
                detection_reason="Standard user equipment bearer throughput within baseline parameters.",
                is_sample=False
            )
            db.add(ev)
            generated_events.append(ev)

            # Update device stats
            dev = db.query(Device).filter(Device.device_id == src).first()
            if dev:
                dev.total_requests += 15
                dev.request_rate = rate
                dev.last_seen = now.isoformat()

        db.commit()
        return {
            "status": "SUCCESS",
            "scenario": "NORMAL_TRAFFIC",
            "events_generated": len(generated_events),
            "message": "Generated ordinary subscriber session traffic; all requests verified and permitted."
        }

    elif scenario == "AUTH_FLOOD":
        src = payload.custom_device or "UE-014"
        dest = "AMF Authentication Service"
        rate = round(random.uniform(48.5, 62.0), 1)
        failed_auths = 14

        eval_res = rules_engine.evaluate(
            source_device=src,
            observed_rate=rate,
            baseline_rate=10.0,
            destination_service=dest,
            request_type="AUTHENTICATE_DEVICE",
            failed_auth_count=failed_auths
        )

        # 1. Add burst traffic events
        for i in range(payload.burst_intensity):
            ev = TrafficEvent(
                timestamp=(now + timedelta(seconds=i * 2)).isoformat(),
                source_device=src,
                request_type="AUTHENTICATE_DEVICE",
                destination_service=dest,
                request_rate=rate,
                risk_score=eval_res["risk_score"],
                classification="ANOMALY",
                action="RATE_LIMIT",
                detection_reason=f"Authentication flood detected ({rate:.1f} req/s). High failure ratio exceeded threshold.",
                is_sample=False
            )
            db.add(ev)
            generated_events.append(ev)

        # 2. Record Threat Detection
        threat = ThreatDetection(
            timestamp=now.isoformat(),
            source_device=src,
            event_type="Authentication Flood Attack",
            observed_rate=rate,
            baseline_rate=10.0,
            deviation_percent=eval_res["rate_deviation_percent"],
            failed_auth_count=failed_auths,
            suspicious_api_count=0,
            risk_score=eval_res["risk_score"],
            risk_level="HIGH",
            observation=eval_res["observation"],
            reason=eval_res["reason"],
            recommended_action=eval_res["recommended_action"],
            decision="RATE_LIMIT",
            status="MITIGATED",
            detection_method="Isolation Forest (ML) + Telecom Risk Model"
        )
        db.add(threat)
        db.flush()

        # 3. Trigger Automated Response Action
        resp_action = ResponseAction(
            timestamp=now.isoformat(),
            threat_id=threat.id,
            source_device=src,
            risk_level="HIGH",
            detection_reason=threat.observation,
            action_type="APPLY_RATE_LIMIT",
            policy_rule="Policy-308: Ingress Rate-Limiting & Quota Throttling Enforced",
            execution_status="SUCCESS",
            details=f"Applied token bucket rate limit of 5 req/s to IMSI/Device {src} across AMF service.",
            is_active=True
        )
        db.add(resp_action)

        # 4. Update Device status
        dev = db.query(Device).filter(Device.device_id == src).first()
        if dev:
            dev.status = "RATE_LIMITED"
            dev.risk_level = "HIGH"
            dev.request_rate = rate
            dev.total_requests += 120
            dev.last_seen = now.isoformat()

        # 5. Log Runtime Telemetry
        db.add(RuntimeTelemetry(
            timestamp=now.isoformat(),
            component="AMF Authentication Service",
            event=f"Rate limit triggered for {src}",
            severity="WARNING",
            status="ELEVATED_LOAD",
            details=f"High-frequency authentication attempts ({rate:.1f} req/s) throttled by Policy-308."
        ))

        db.commit()
        return {
            "status": "SUCCESS",
            "scenario": "AUTH_FLOOD",
            "threat_id": threat.id,
            "risk_score": eval_res["risk_score"],
            "risk_level": "HIGH",
            "action_taken": "APPLY_RATE_LIMIT",
            "message": f"Authentication flood detected from {src}. AI Isolation Forest identified anomaly and applied automated rate limiting."
        }

    elif scenario == "SUSPICIOUS_API":
        src = payload.custom_device or "API-Client-007"
        dest = "Telecom Core API Service"
        rate = round(random.uniform(22.0, 32.5), 1)

        eval_res = rules_engine.evaluate(
            source_device=src,
            observed_rate=rate,
            baseline_rate=12.0,
            destination_service=dest,
            request_type="API_REQUEST",
            suspicious_api_count=7
        )

        for i in range(payload.burst_intensity):
            ev = TrafficEvent(
                timestamp=(now + timedelta(seconds=i * 2)).isoformat(),
                source_device=src,
                request_type="API_REQUEST",
                destination_service=dest,
                request_rate=rate,
                risk_score=eval_res["risk_score"],
                classification="SUSPICIOUS",
                action="FLAG_AND_MONITOR",
                detection_reason="Anomalous query payload pattern targeting internal 3GPP NEF subscriber attributes.",
                is_sample=False
            )
            db.add(ev)
            generated_events.append(ev)

        threat = ThreatDetection(
            timestamp=now.isoformat(),
            source_device=src,
            event_type="Suspicious API Reconnaissance",
            observed_rate=rate,
            baseline_rate=12.0,
            deviation_percent=eval_res["rate_deviation_percent"],
            failed_auth_count=1,
            suspicious_api_count=7,
            risk_score=eval_res["risk_score"],
            risk_level="MEDIUM",
            observation=eval_res["observation"],
            reason=eval_res["reason"],
            recommended_action=eval_res["recommended_action"],
            decision="MONITOR",
            status="DETECTED",
            detection_method="Isolation Forest (ML) + Telecom Risk Model"
        )
        db.add(threat)
        db.flush()

        resp_action = ResponseAction(
            timestamp=now.isoformat(),
            threat_id=threat.id,
            source_device=src,
            risk_level="MEDIUM",
            detection_reason=threat.observation,
            action_type="FLAG_SOURCE",
            policy_rule="Policy-204: Elevated Telemetry Sampling & Threat Logging",
            execution_status="SUCCESS",
            details=f"Enabled deep packet inspection and detailed audit logging for API token of {src}.",
            is_active=True
        )
        db.add(resp_action)

        dev = db.query(Device).filter(Device.device_id == src).first()
        if dev:
            dev.status = "MONITORED"
            dev.risk_level = "MEDIUM"
            dev.request_rate = rate
            dev.total_requests += 65
            dev.last_seen = now.isoformat()

        db.add(RuntimeTelemetry(
            timestamp=now.isoformat(),
            component="Telecom Core API Service",
            event=f"Audit flag raised for {src}",
            severity="WARNING",
            status="NORMAL",
            details="Elevated API exploration telemetry routed to Security Operations Center."
        ))

        db.commit()
        return {
            "status": "SUCCESS",
            "scenario": "SUSPICIOUS_API",
            "threat_id": threat.id,
            "risk_score": eval_res["risk_score"],
            "risk_level": "MEDIUM",
            "action_taken": "FLAG_SOURCE",
            "message": f"Suspicious API activity detected from {src}. Client flagged for enhanced security auditing."
        }

    elif scenario == "DDOS_BURST":
        src = payload.custom_device or "Botnet-Proxy-44"
        dest = "5G Ingress Gateway"
        rate = round(random.uniform(96.0, 118.0), 1)

        eval_res = rules_engine.evaluate(
            source_device=src,
            observed_rate=rate,
            baseline_rate=12.0,
            destination_service=dest,
            request_type="API_REQUEST",
            failed_auth_count=20,
            suspicious_api_count=10
        )

        for i in range(payload.burst_intensity):
            ev = TrafficEvent(
                timestamp=(now + timedelta(seconds=i * 2)).isoformat(),
                source_device=src,
                request_type="DATA_SESSION",
                destination_service=dest,
                request_rate=rate,
                risk_score=eval_res["risk_score"],
                classification="MALICIOUS",
                action="BLOCK",
                detection_reason="Volumetric traffic surge exceeding ingress firewall thresholds. Immediate containment applied.",
                is_sample=False
            )
            db.add(ev)
            generated_events.append(ev)

        threat = ThreatDetection(
            timestamp=now.isoformat(),
            source_device=src,
            event_type="DDoS-Style Volumetric Flood",
            observed_rate=rate,
            baseline_rate=12.0,
            deviation_percent=eval_res["rate_deviation_percent"],
            failed_auth_count=20,
            suspicious_api_count=10,
            risk_score=eval_res["risk_score"],
            risk_level="CRITICAL",
            observation=eval_res["observation"],
            reason=eval_res["reason"],
            recommended_action=eval_res["recommended_action"],
            decision="CONTAIN",
            status="MITIGATED",
            detection_method="Isolation Forest (ML) + Telecom Risk Model"
        )
        db.add(threat)
        db.flush()

        resp_action = ResponseAction(
            timestamp=now.isoformat(),
            threat_id=threat.id,
            source_device=src,
            risk_level="CRITICAL",
            detection_reason=threat.observation,
            action_type="BLOCK_SOURCE",
            policy_rule="Policy-401: Immediate Network Isolation & Bearer Teardown",
            execution_status="SUCCESS",
            details=f"Dropped all incoming sessions from {src}. Boundary proxy IP filter installed.",
            is_active=True
        )
        db.add(resp_action)

        dev = db.query(Device).filter(Device.device_id == src).first()
        if dev:
            dev.status = "BLOCKED"
            dev.risk_level = "CRITICAL"
            dev.request_rate = rate
            dev.total_requests += 250
            dev.last_seen = now.isoformat()

        db.add(RuntimeTelemetry(
            timestamp=now.isoformat(),
            component="5G Ingress Gateway",
            event=f"Automated containment: blocked {src}",
            severity="CRITICAL",
            status="ISOLATED",
            details=f"Policy-401 dropped {len(generated_events)} packets; threat mitigation verified."
        ))

        db.commit()
        return {
            "status": "SUCCESS",
            "scenario": "DDOS_BURST",
            "threat_id": threat.id,
            "risk_score": eval_res["risk_score"],
            "risk_level": "CRITICAL",
            "action_taken": "BLOCK_SOURCE",
            "message": f"DDoS-style traffic burst detected from {src}. Automated containment blocked the source."
        }

    else:
        raise HTTPException(status_code=400, detail=f"Unknown scenario type: {scenario}")
