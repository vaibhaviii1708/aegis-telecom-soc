import json
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database.session import get_db
from app.database.models import PipelineRun, PipelineFinding
from app.pipeline.scanner import pipeline_scanner
from app.schemas.schemas import PipelineRunOut, PipelineFindingOut, PipelineRunRequest, PipelineStageSummary

router = APIRouter(prefix="/pipeline", tags=["DevSecOps Pipeline"])

@router.get("/latest", response_model=PipelineRunOut)
def get_latest_pipeline_run(db: Session = Depends(get_db)):
    run = db.query(PipelineRun).order_by(desc(PipelineRun.timestamp)).first()
    if not run:
        # Fallback run
        run_data = pipeline_scanner.run_full_pipeline()
        run = PipelineRun(
            timestamp=datetime.now(timezone.utc).isoformat(),
            commit_hash=run_data["commit_hash"],
            branch=run_data["branch"],
            overall_status=run_data["overall_status"],
            risk_score=run_data["risk_score"],
            deployment_decision=run_data["deployment_decision"],
            duration_seconds=run_data["duration_seconds"],
            stages_data=json.dumps(run_data["stages"])
        )
        db.add(run)
        db.commit()
        db.refresh(run)

    stages_list = [PipelineStageSummary(**s) for s in json.loads(run.stages_data)]
    findings = db.query(PipelineFinding).order_by(PipelineFinding.id).all()
    
    return PipelineRunOut(
        id=run.id,
        timestamp=run.timestamp,
        commit_hash=run.commit_hash,
        branch=run.branch,
        overall_status=run.overall_status,
        risk_score=run.risk_score,
        deployment_decision=run.deployment_decision,
        duration_seconds=run.duration_seconds,
        stages=stages_list,
        findings=[PipelineFindingOut.model_validate(f) for f in findings]
    )

@router.get("/findings", response_model=List[PipelineFindingOut])
def get_pipeline_findings(
    db: Session = Depends(get_db),
    severity: Optional[str] = None
):
    query = db.query(PipelineFinding).filter(PipelineFinding.is_active == True)
    if severity and severity != "ALL":
        query = query.filter(PipelineFinding.severity == severity)
    findings = query.order_by(PipelineFinding.id).all()
    return [PipelineFindingOut.model_validate(f) for f in findings]

@router.post("/execute", response_model=PipelineRunOut)
def execute_pipeline(payload: PipelineRunRequest, db: Session = Depends(get_db)):
    """
    Executes all pre-deployment DevSecOps security stages against the sample telecom codebase,
    evaluates security gates, and renders an automated deployment decision.
    """
    result = pipeline_scanner.run_full_pipeline(branch=payload.target_branch or "release/v1.4.0-cloud-core")
    
    run = PipelineRun(
        timestamp=datetime.now(timezone.utc).isoformat(),
        commit_hash=result["commit_hash"],
        branch=result["branch"],
        overall_status=result["overall_status"],
        risk_score=result["risk_score"],
        deployment_decision=result["deployment_decision"],
        duration_seconds=result["duration_seconds"],
        stages_data=json.dumps(result["stages"])
    )
    db.add(run)
    db.flush()

    # Clear previous active findings to reflect this run
    db.query(PipelineFinding).delete()
    for f in result["findings"]:
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

    db.commit()
    db.refresh(run)

    stages_list = [PipelineStageSummary(**s) for s in result["stages"]]
    findings = db.query(PipelineFinding).all()

    return PipelineRunOut(
        id=run.id,
        timestamp=run.timestamp,
        commit_hash=run.commit_hash,
        branch=run.branch,
        overall_status=run.overall_status,
        risk_score=run.risk_score,
        deployment_decision=run.deployment_decision,
        duration_seconds=run.duration_seconds,
        stages=stages_list,
        findings=[PipelineFindingOut.model_validate(f) for f in findings]
    )
