import pytest
from app.pipeline.scanner import pipeline_scanner

def test_pipeline_execution():
    result = pipeline_scanner.run_full_pipeline(branch="feature/security-hardening")
    assert result["commit_hash"] == "a4f91e8"
    assert len(result["stages"]) == 7
    assert len(result["findings"]) > 0
    assert 0.0 <= result["risk_score"] <= 100.0
    assert result["deployment_decision"] in ["PERMITTED_TO_DEPLOY", "DEPLOYMENT_BLOCKED"]

def test_pipeline_findings_types():
    result = pipeline_scanner.run_full_pipeline()
    finding_types = [f["finding_type"] for f in result["findings"]]
    # Should detect secret leak, weak crypto, and insecure config
    assert "SECRET_LEAK" in finding_types
    assert "WEAK_CRYPTO" in finding_types
    assert "INSECURE_CONFIG" in finding_types
