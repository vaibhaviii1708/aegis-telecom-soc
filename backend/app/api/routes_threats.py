from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database.session import get_db
from app.database.models import ThreatDetection
from app.schemas.schemas import ThreatDetectionOut, ThreatAnalysisRequest
from app.detection.anomaly_engine import anomaly_engine
from app.detection.rules_engine import rules_engine

router = APIRouter(prefix="/threats", tags=["AI Threat Detection"])

@router.get("", response_model=List[ThreatDetectionOut])
def get_threats(
    db: Session = Depends(get_db),
    risk_level: Optional[str] = None,
    limit: int = Query(default=50, ge=1, le=100)
):
    query = db.query(ThreatDetection)
    if risk_level and risk_level != "ALL":
        query = query.filter(ThreatDetection.risk_level == risk_level)
    threats = query.order_by(desc(ThreatDetection.timestamp)).limit(limit).all()
    return [ThreatDetectionOut.model_validate(t) for t in threats]

@router.get("/model-info")
def get_model_metadata() -> Dict[str, Any]:
    """
    Transparent documentation of the integrated anomaly detection model,
    features, training parameters, and operational scope.
    """
    return {
        "model_architecture": "Scikit-Learn Isolation Forest (iForest)",
        "framework": "Python 3.14 / scikit-learn",
        "n_estimators": anomaly_engine.n_estimators,
        "contamination_factor": anomaly_engine.contamination,
        "features": [
            {
                "name": "norm_rate",
                "description": "Observed request throughput normalized against saturation ceiling (150 req/s)."
            },
            {
                "name": "rate_deviation",
                "description": "Percentage divergence of observed throughput relative to device baseline."
            },
            {
                "name": "endpoint_sensitivity",
                "description": "3GPP network function critical factor (e.g. AMF auth=0.85, Ingress=0.60)."
            },
            {
                "name": "request_weight",
                "description": "Signaling sensitivity weight (e.g. Authenticate=0.60, DataSession=0.15)."
            },
            {
                "name": "norm_auth_fail",
                "description": "Consecutive challenge-handshake failures normalized to threshold."
            },
            {
                "name": "norm_api_suspicion",
                "description": "Frequency of malformed or unauthorized parameter probes."
            }
        ],
        "training_baseline": {
            "dataset": "Synthetic baseline distribution of 1,200 non-anomalous 5G network function telemetry vectors",
            "seed": 42,
            "status": "Initialized and fitted"
        },
        "academic_disclosure": {
            "simulated_scope": "Evaluated against synthetic cloud-native telecom payloads. Does not interface with physical 5G base stations.",
            "decision_fusion": "Isolation Forest decision function mapped to continuous risk score and augmented with 3GPP policy threshold rules."
        }
    }

@router.post("/analyze")
def analyze_telemetry_point(payload: ThreatAnalysisRequest):
    """
    Real-time interactive ML inference tool: evaluates user-specified telemetry
    parameters through the trained Isolation Forest model and returns the risk breakdown.
    """
    dest_service = "AMF Authentication Service" if "AUTH" in payload.request_type else "5G Ingress Gateway"
    result = rules_engine.evaluate(
        source_device=payload.source_device,
        observed_rate=payload.request_rate,
        baseline_rate=10.0,
        destination_service=dest_service,
        request_type=payload.request_type,
        failed_auth_count=payload.failed_auth_count,
        suspicious_api_count=payload.suspicious_api_count
    )
    return result
