from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database.session import get_db
from app.database.models import RuntimeService, RuntimeTelemetry
from app.schemas.schemas import RuntimeServiceOut, RuntimeTelemetryOut

router = APIRouter(prefix="/runtime", tags=["Runtime Monitoring"])

@router.get("/services", response_model=List[RuntimeServiceOut])
def get_runtime_services(db: Session = Depends(get_db)):
    services = db.query(RuntimeService).all()
    return [RuntimeServiceOut.model_validate(s) for s in services]

@router.get("/telemetry", response_model=List[RuntimeTelemetryOut])
def get_runtime_telemetry(
    db: Session = Depends(get_db),
    component: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = Query(default=50, ge=1, le=100)
):
    query = db.query(RuntimeTelemetry)
    if component and component != "ALL":
        query = query.filter(RuntimeTelemetry.component == component)
    if severity and severity != "ALL":
        query = query.filter(RuntimeTelemetry.severity == severity)
    logs = query.order_by(desc(RuntimeTelemetry.timestamp)).limit(limit).all()
    return [RuntimeTelemetryOut.model_validate(l) for l in logs]

@router.get("/topology")
def get_runtime_topology(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Returns nodes and interconnects of the cloud-native telecom microservices architecture.
    """
    services = {s.name: s for s in db.query(RuntimeService).all()}

    nodes = [
        {
            "id": "node-devices",
            "name": "End-User Devices",
            "type": "FLEET",
            "status": "OPERATIONAL",
            "metrics": "156 Active UEs & Gateways",
            "layer": "Edge Ingress"
        },
        {
            "id": "node-ingress",
            "name": "5G Ingress Gateway",
            "type": "INGRESS",
            "status": services.get("5G Ingress Gateway", {}).operational_status if "5G Ingress Gateway" in services else "HEALTHY",
            "metrics": f"{services.get('5G Ingress Gateway', {}).request_rate or 142.5:.1f} req/s | 8.2ms",
            "layer": "Perimeter Control"
        },
        {
            "id": "node-amf",
            "name": "AMF Authentication Service",
            "type": "AUTH",
            "status": services.get("AMF Authentication Service", {}).operational_status if "AMF Authentication Service" in services else "HEALTHY",
            "metrics": f"{services.get('AMF Authentication Service', {}).request_rate or 78.2:.1f} req/s | 22.4ms",
            "layer": "Core Microservices"
        },
        {
            "id": "node-smf",
            "name": "SMF Session Management",
            "type": "SESSION",
            "status": services.get("SMF Session Management", {}).operational_status if "SMF Session Management" in services else "HEALTHY",
            "metrics": f"{services.get('SMF Session Management', {}).request_rate or 54.1:.1f} req/s | 14.1ms",
            "layer": "Core Microservices"
        },
        {
            "id": "node-api",
            "name": "Telecom Core API Service",
            "type": "API",
            "status": services.get("Telecom Core API Service", {}).operational_status if "Telecom Core API Service" in services else "HEALTHY",
            "metrics": f"{services.get('Telecom Core API Service', {}).request_rate or 32.9:.1f} req/s | 16.8ms",
            "layer": "Northbound Interface"
        },
        {
            "id": "node-ai",
            "name": "AI Threat Detection Engine",
            "type": "SECURITY",
            "status": "HEALTHY",
            "metrics": "Isolation Forest iForest | Active",
            "layer": "Security Intelligence"
        },
        {
            "id": "node-response",
            "name": "Automated Response Engine",
            "type": "RESPONSE",
            "status": "HEALTHY",
            "metrics": "Policy Matrix Enforcer | Active",
            "layer": "Containment Layer"
        }
    ]

    links = [
        {"source": "node-devices", "target": "node-ingress", "protocol": "NAS / 5G NR"},
        {"source": "node-ingress", "target": "node-amf", "protocol": "HTTP/2 REST (N1/N2)"},
        {"source": "node-ingress", "target": "node-smf", "protocol": "HTTP/2 REST (N11)"},
        {"source": "node-ingress", "target": "node-api", "protocol": "HTTPS (NEF API)"},
        {"source": "node-ingress", "target": "node-ai", "protocol": "Telemetry Mirror"},
        {"source": "node-amf", "target": "node-ai", "protocol": "Auth Audit Stream"},
        {"source": "node-ai", "target": "node-response", "protocol": "Threat Signal"},
        {"source": "node-response", "target": "node-ingress", "protocol": "Dynamic Firewall Rule"}
    ]

    return {
        "architecture_name": "Cloud-Native 5G Service-Based Architecture (SBA)",
        "telemetry_source": "Synthetic application-level microservice telemetry",
        "nodes": nodes,
        "links": links
    }
