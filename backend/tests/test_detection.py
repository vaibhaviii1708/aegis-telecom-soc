import pytest
from app.detection.anomaly_engine import anomaly_engine
from app.detection.feature_extractor import TelecomFeatureExtractor
from app.detection.rules_engine import rules_engine

def test_feature_extractor():
    features = TelecomFeatureExtractor.extract_features(
        observed_rate=25.0,
        baseline_rate=10.0,
        destination_service="Auth Service (AMF)",
        request_type="AUTHENTICATE_DEVICE",
        failed_auth_count=5,
        suspicious_api_count=1
    )
    assert "feature_vector" in features
    assert len(features["feature_vector"]) == 6
    assert features["rate_deviation_percent"] == 150.0

def test_anomaly_engine_baseline():
    assert anomaly_engine.is_trained is True
    # Test normal traffic profile
    res = anomaly_engine.analyze_event(
        observed_rate=6.0,
        baseline_rate=8.0,
        destination_service="Session Mgmt (SMF)",
        request_type="DATA_SESSION",
        failed_auth_count=0
    )
    assert res["risk_level"] in ["LOW", "MEDIUM"]
    assert res["action"] in ["ALLOW", "FLAG_AND_MONITOR"]
    assert 0.0 <= res["risk_score"] <= 100.0

def test_anomaly_engine_flood():
    # Test high rate auth flood
    res = anomaly_engine.analyze_event(
        observed_rate=85.0,
        baseline_rate=10.0,
        destination_service="Auth Service (AMF)",
        request_type="AUTHENTICATE_DEVICE",
        failed_auth_count=15
    )
    assert res["risk_level"] in ["HIGH", "CRITICAL"]
    assert res["action"] in ["RATE_LIMIT", "BLOCK"]
    assert res["risk_score"] > 60.0

def test_rules_engine_evaluation():
    eval_res = rules_engine.evaluate(
        source_device="UE-Test-01",
        observed_rate=95.0,
        baseline_rate=10.0,
        destination_service="5G Ingress Gateway",
        request_type="API_REQUEST",
        failed_auth_count=18
    )
    assert "policy_rule" in eval_res
    assert "enforced_action" in eval_res
    assert eval_res["risk_level"] == "CRITICAL"
