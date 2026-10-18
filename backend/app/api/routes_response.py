from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database.session import get_db
from app.database.models import ResponseAction, Device, ThreatDetection, RuntimeTelemetry
from app.schemas.schemas import ResponseActionOut, ResponseActionCreate

router = APIRouter(prefix="/response", tags=["Automated Response"])

@router.get("/actions", response_model=List[ResponseActionOut])
def get_response_actions(
    db: Session = Depends(get_db),
    risk_level: Optional[str] = None,
    action_type: Optional[str] = None,
    execution_status: Optional[str] = None,
    limit: int = Query(default=50, ge=1, le=100)
):
    query = db.query(ResponseAction)
    if risk_level and risk_level != "ALL":
        query = query.filter(ResponseAction.risk_level == risk_level)
    if action_type and action_type != "ALL":
        query = query.filter(ResponseAction.action_type == action_type)
    if execution_status and execution_status != "ALL":
        query = query.filter(ResponseAction.execution_status == execution_status)

    actions = query.order_by(desc(ResponseAction.timestamp)).limit(limit).all()
    return [ResponseActionOut.model_validate(a) for a in actions]

@router.post("/release/{device_id}")
def release_device_containment(device_id: str, db: Session = Depends(get_db)):
    """
    Releases an active block or rate-limit on a device, restoring it to ACTIVE status
    and recording the reversion action in the security event log.
    """
    dev = db.query(Device).filter(Device.device_id == device_id).first()
    if not dev:
        raise HTTPException(status_code=404, detail=f"Device '{device_id}' not found.")

    previous_status = dev.status
    dev.status = "ACTIVE"
    dev.risk_level = "NORMAL"

    # Deactivate previous active blocking actions for this device
    active_actions = db.query(ResponseAction).filter(
        ResponseAction.source_device == device_id,
        ResponseAction.is_active == True
    ).all()
    for act in active_actions:
        act.is_active = False

    now_iso = datetime.now(timezone.utc).isoformat()
    release_action = ResponseAction(
        timestamp=now_iso,
        threat_id=None,
        source_device=device_id,
        risk_level="LOW",
        detection_reason=f"Operator manual clearance: revoked previous '{previous_status}' restriction.",
        action_type="RELEASE_BLOCK",
        policy_rule="Policy-102: Administrative Quarantine Override & Route Restoration",
        execution_status="SUCCESS",
        details=f"Restored full network routing privileges to {device_id}. Firewall access rule purged.",
        is_active=False
    )
    db.add(release_action)

    # Telemetry log
    db.add(RuntimeTelemetry(
        timestamp=now_iso,
        component="Automated Response Engine",
        event=f"Quarantine released for {device_id}",
        severity="INFO",
        status="NORMAL",
        details=f"Device {device_id} restored to ACTIVE baseline."
    ))

    db.commit()
    return {
        "status": "SUCCESS",
        "device_id": device_id,
        "new_status": "ACTIVE",
        "message": f"Successfully cleared restrictions on {device_id}. Normal traffic flow reinstated."
    }

@router.post("/execute", response_model=ResponseActionOut)
def manual_response_action(payload: ResponseActionCreate, db: Session = Depends(get_db)):
    """
    Allows a SOC security operator to manually apply or modify containment actions on a source.
    """
    dev = db.query(Device).filter(Device.device_id == payload.source_device).first()
    now_iso = datetime.now(timezone.utc).isoformat()

    if payload.action_type == "BLOCK_SOURCE":
        risk = "CRITICAL"
        rule = "Policy-401: Immediate Network Isolation & Bearer Teardown"
        if dev:
            dev.status = "BLOCKED"
            dev.risk_level = "CRITICAL"
    elif payload.action_type == "APPLY_RATE_LIMIT":
        risk = "HIGH"
        rule = "Policy-308: Ingress Rate-Limiting & Quota Throttling Enforced"
        if dev:
            dev.status = "RATE_LIMITED"
            dev.risk_level = "HIGH"
    elif payload.action_type == "FLAG_SOURCE":
        risk = "MEDIUM"
        rule = "Policy-204: Elevated Telemetry Sampling & Threat Logging"
        if dev:
            dev.status = "MONITORED"
            dev.risk_level = "MEDIUM"
    else:
        risk = "LOW"
        rule = "Policy-101: Baseline Traffic Permitted with Passive Auditing"

    action = ResponseAction(
        timestamp=now_iso,
        threat_id=None,
        source_device=payload.source_device,
        risk_level=risk,
        detection_reason=payload.reason or "Manual operator action from AEGIS SOC console.",
        action_type=payload.action_type,
        policy_rule=rule,
        execution_status="SUCCESS",
        details=f"Operator executed {payload.action_type} on {payload.source_device}.",
        is_active=True
    )
    db.add(action)
    db.commit()
    db.refresh(action)

    return ResponseActionOut.from_orm(action)
