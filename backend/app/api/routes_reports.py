import io
import csv
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from app.database.session import get_db
from app.database.models import (
    TrafficEvent, ThreatDetection, ResponseAction, PipelineRun, PipelineFinding, Device
)
from app.schemas.schemas import TrafficEventOut

router = APIRouter(prefix="/reports", tags=["Security Reports"])

@router.get("/summary")
def get_reports_summary(
    db: Session = Depends(get_db),
    risk_level: Optional[str] = None,
    event_type: Optional[str] = None,
    source_device: Optional[str] = None
) -> Dict[str, Any]:
    """
    Returns aggregated security report metrics, breakdown charts, and executive insights.
    """
    events_query = db.query(TrafficEvent)
    if risk_level and risk_level != "ALL":
        if risk_level == "NORMAL":
            events_query = events_query.filter(TrafficEvent.classification == "NORMAL")
        elif risk_level == "LOW":
            events_query = events_query.filter(TrafficEvent.risk_score <= 35.0, TrafficEvent.classification != "NORMAL")
        elif risk_level == "MEDIUM":
            events_query = events_query.filter(TrafficEvent.classification == "SUSPICIOUS")
        elif risk_level in ["HIGH", "CRITICAL"]:
            events_query = events_query.filter(TrafficEvent.classification.in_(["ANOMALY", "MALICIOUS"]))

    if event_type and event_type != "ALL":
        events_query = events_query.filter(TrafficEvent.request_type == event_type)

    if source_device and source_device != "ALL":
        events_query = events_query.filter(TrafficEvent.source_device == source_device)

    total_events = events_query.count()
    events = events_query.order_by(desc(TrafficEvent.timestamp)).limit(100).all()

    # Threat severity counts
    threats_by_severity = {
        "CRITICAL": db.query(ThreatDetection).filter(ThreatDetection.risk_level == "CRITICAL").count(),
        "HIGH": db.query(ThreatDetection).filter(ThreatDetection.risk_level == "HIGH").count(),
        "MEDIUM": db.query(ThreatDetection).filter(ThreatDetection.risk_level == "MEDIUM").count(),
        "LOW": db.query(ThreatDetection).filter(ThreatDetection.risk_level == "LOW").count()
    }

    # Pipeline summary
    latest_pipeline = db.query(PipelineRun).order_by(desc(PipelineRun.timestamp)).first()
    vulnerabilities_by_severity = {
        "CRITICAL": db.query(PipelineFinding).filter(PipelineFinding.severity == "CRITICAL").count(),
        "HIGH": db.query(PipelineFinding).filter(PipelineFinding.severity == "HIGH").count(),
        "MEDIUM": db.query(PipelineFinding).filter(PipelineFinding.severity == "MEDIUM").count(),
        "LOW": db.query(PipelineFinding).filter(PipelineFinding.severity == "LOW").count(),
    }

    # Automated responses count
    responses_count = db.query(ResponseAction).count()

    return {
        "report_generated_at": datetime.now(timezone.utc).isoformat(),
        "total_events_in_scope": total_events,
        "threats_by_severity": threats_by_severity,
        "vulnerabilities_by_severity": vulnerabilities_by_severity,
        "total_mitigations_executed": responses_count,
        "latest_pipeline": {
            "commit": latest_pipeline.commit_hash if latest_pipeline else "N/A",
            "branch": latest_pipeline.branch if latest_pipeline else "N/A",
            "decision": latest_pipeline.deployment_decision if latest_pipeline else "N/A",
            "risk_score": latest_pipeline.risk_score if latest_pipeline else 0.0,
            "status": latest_pipeline.overall_status if latest_pipeline else "N/A"
        },
        "events": [TrafficEventOut.model_validate(e) for e in events]
    }

@router.get("/export/csv")
def export_security_events_csv(
    db: Session = Depends(get_db),
    risk_level: Optional[str] = None,
    source_device: Optional[str] = None
):
    """
    Streams a structured CSV export containing all matching security and telemetry events.
    """
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

    if source_device and source_device != "ALL":
        query = query.filter(TrafficEvent.source_device == source_device)

    events = query.order_by(desc(TrafficEvent.timestamp)).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Event ID", "Timestamp (UTC)", "Source Device", "Request Type",
        "Destination Service", "Observed Rate (req/s)", "Risk Score",
        "Classification", "Action Taken", "Detection Reason"
    ])

    for e in events:
        writer.writerow([
            e.id,
            e.timestamp,
            e.source_device,
            e.request_type,
            e.destination_service,
            e.request_rate,
            e.risk_score,
            e.classification,
            e.action,
            e.detection_reason
        ])

    csv_data = output.getvalue()
    filename = f"aegis_security_events_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
