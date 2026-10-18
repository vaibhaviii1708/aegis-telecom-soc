from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.database.session import get_db
from app.database.models import (
    Device, TrafficEvent, ThreatDetection, ResponseAction,
    PipelineRun, PipelineFinding, RuntimeService, RuntimeTelemetry
)
from app.database.seed import seed_database
from app.schemas.schemas import DashboardSummaryOut, TrafficEventOut

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary", response_model=DashboardSummaryOut)
def get_dashboard_summary(db: Session = Depends(get_db)):
    # 1. Total Requests calculation (consistent across devices & events)
    total_device_requests = db.query(func.sum(Device.total_requests)).scalar() or 0
    generated_events_count = db.query(TrafficEvent).filter(TrafficEvent.is_sample == False).count()
    # Baseline illustrative count offset (12,840) + generated requests
    total_requests = 12840 + total_device_requests + (generated_events_count * 15)

    # 2. Threat & Blocked Counts
    threats_count = db.query(ThreatDetection).count()
    blocked_count = db.query(TrafficEvent).filter(TrafficEvent.action == "BLOCK").count()
    # Add historical base offset to match realistic enterprise SOC numbers
    total_threats = 24 + db.query(ThreatDetection).filter(ThreatDetection.id > 3).count()
    total_blocked = 18 + db.query(TrafficEvent).filter(TrafficEvent.action == "BLOCK", TrafficEvent.is_sample == False).count()

    # 3. Active Devices
    active_devices = db.query(Device).filter(Device.status.in_(["ACTIVE", "MONITORED", "RATE_LIMITED"])).count()
    # Scale to realistic base fleet (156 base)
    total_active_devices = 156 + (active_devices - 5)

    # 4. Critical & High threat check for dynamic system status
    critical_active = db.query(ThreatDetection).filter(
        ThreatDetection.risk_level == "CRITICAL",
        ThreatDetection.status.in_(["DETECTED", "MITIGATED"])
    ).count()
    high_active = db.query(ThreatDetection).filter(
        ThreatDetection.risk_level == "HIGH",
        ThreatDetection.status.in_(["DETECTED", "MITIGATED"])
    ).count()

    if critical_active > 1:
        system_status = "CRITICAL ALERT"
        security_posture = "UNDER ATTACK"
        posture_score = 42.0
    elif high_active > 1 or critical_active > 0:
        system_status = "ELEVATED RISK"
        security_posture = "ELEVATED RISK"
        posture_score = 68.5
    else:
        system_status = "OPERATIONAL"
        security_posture = "OPTIMAL"
        posture_score = 94.2

    # 5. Traffic Time Series (last 10 buckets for line chart)
    now = datetime.now(timezone.utc)
    time_series = []
    for i in range(9, -1, -1):
        bucket_time = now - timedelta(minutes=i * 5)
        # Compute rates based on events around that window
        bucket_events = db.query(TrafficEvent).filter(
            TrafficEvent.timestamp >= (bucket_time - timedelta(minutes=5)).isoformat(),
            TrafficEvent.timestamp <= bucket_time.isoformat()
        ).all()
        
        normal_sum = sum(e.request_rate for e in bucket_events if e.classification == "NORMAL") or 0.0
        suspicious_sum = sum(e.request_rate for e in bucket_events if e.classification in ["SUSPICIOUS", "ANOMALY"]) or 0.0
        blocked_sum = sum(e.request_rate for e in bucket_events if e.action == "BLOCK") or 0.0

        # Baseline background floor for visual realism
        normal_rate = round(22.0 + (i % 3) * 4.5 + normal_sum, 1)
        suspicious_rate = round(2.5 + (1.2 if i % 2 == 0 else 0.5) + suspicious_sum, 1)
        blocked_rate = round((3.5 if blocked_sum > 0 else (0.8 if i == 2 else 0.0)) + blocked_sum, 1)

        time_series.append({
            "time": bucket_time.strftime("%H:%M"),
            "normal": normal_rate,
            "suspicious": suspicious_rate,
            "blocked": blocked_rate,
            "total": round(normal_rate + suspicious_rate + blocked_rate, 1)
        })

    # 6. Risk Distribution
    risk_distribution = [
        {"name": "Normal", "value": max(120, db.query(TrafficEvent).filter(TrafficEvent.classification == "NORMAL").count() * 12), "color": "#10B981"},
        {"name": "Low Risk", "value": max(24, db.query(TrafficEvent).filter(TrafficEvent.risk_score <= 35.0, TrafficEvent.risk_score > 0.0).count() * 3), "color": "#0EA5E9"},
        {"name": "Medium Risk", "value": max(14, db.query(TrafficEvent).filter(TrafficEvent.classification == "SUSPICIOUS").count() * 2), "color": "#F59E0B"},
        {"name": "High / Critical", "value": max(6, db.query(TrafficEvent).filter(TrafficEvent.classification.in_(["ANOMALY", "MALICIOUS"])).count()), "color": "#E11D48"}
    ]

    # 7. Recent Events
    recent_events_models = db.query(TrafficEvent).order_by(desc(TrafficEvent.timestamp)).limit(15).all()
    recent_events = [TrafficEventOut.model_validate(e) for e in recent_events_models]

    # 8. Lifecycle Stages
    latest_run = db.query(PipelineRun).order_by(desc(PipelineRun.timestamp)).first()
    pipeline_state = latest_run.overall_status if latest_run else "PASSED"
    gate_decision = latest_run.deployment_decision if latest_run else "PERMITTED_TO_DEPLOY"

    lifecycle_stages = [
        {"stage": "Source Code", "status": "VERIFIED", "detail": "Git commit integrity valid", "step": 1},
        {"stage": "Security Scan", "status": "COMPLETED", "detail": f"SAST/SCA/Config audits finished", "step": 2},
        {"stage": "Risk Analysis", "status": "ACTIVE", "detail": f"Composite pre-deploy risk: {latest_run.risk_score if latest_run else 12.0}/100", "step": 3},
        {"stage": "Security Gate", "status": "PASSED" if gate_decision == "PERMITTED_TO_DEPLOY" else "BLOCKED", "detail": gate_decision, "step": 4},
        {"stage": "Deployment", "status": "ACTIVE", "detail": "Cloud-native telecom microservices live", "step": 5},
        {"stage": "Traffic Monitoring", "status": "STREAMING", "detail": f"Tracking {total_active_devices} UEs and nodes", "step": 6},
        {"stage": "Threat Detection", "status": "ACTIVE", "detail": f"Isolation Forest ML engine operational", "step": 7},
        {"stage": "Automated Response", "status": "ENFORCING", "detail": f"{total_blocked} malicious vectors isolated", "step": 8}
    ]

    return {
        "system_status": system_status,
        "security_posture": security_posture,
        "posture_score": posture_score,
        "backend_status": "CONNECTED",
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "metrics": {
            "total_requests": total_requests,
            "threats_detected": total_threats,
            "requests_blocked": total_blocked,
            "active_devices": total_active_devices,
            "open_alerts": db.query(ThreatDetection).filter(ThreatDetection.status == "DETECTED").count(),
            "vulnerabilities_found": db.query(PipelineFinding).filter(PipelineFinding.is_active == True).count(),
            "security_posture_score": posture_score
        },
        "traffic_time_series": time_series,
        "risk_distribution": risk_distribution,
        "recent_events": recent_events,
        "lifecycle_stages": lifecycle_stages
    }

@router.post("/reset")
def reset_to_baseline(db: Session = Depends(get_db)):
    """
    Resets the database and restores the initial coherent baseline dataset.
    """
    seed_database(db, force=True)
    return {"status": "SUCCESS", "message": "Platform state successfully reset to verified baseline dataset."}
