from typing import List, Dict, Any
from app.detection.anomaly_engine import anomaly_engine

class TelecomRulesEngine:
    """
    Deterministic rule and policy evaluation engine for cloud-native telecom network functions,
    bridging AI detection scores with policy enforcement decisions.
    """

    POLICY_MATRIX = {
        "LOW": {
            "action": "ALLOW",
            "decision": "ALLOW",
            "policy": "Policy-101: Baseline Traffic Permitted with Passive Auditing"
        },
        "MEDIUM": {
            "action": "FLAG_AND_MONITOR",
            "decision": "MONITOR",
            "policy": "Policy-204: Elevated Telemetry Sampling & Threat Logging"
        },
        "HIGH": {
            "action": "RATE_LIMIT",
            "decision": "RATE_LIMIT",
            "policy": "Policy-308: Ingress Rate-Limiting & Quota Throttling Enforced"
        },
        "CRITICAL": {
            "action": "BLOCK",
            "decision": "CONTAIN",
            "policy": "Policy-401: Immediate Network Isolation & Bearer Teardown"
        }
    }

    @staticmethod
    def evaluate(
        source_device: str,
        observed_rate: float,
        baseline_rate: float,
        destination_service: str,
        request_type: str,
        failed_auth_count: int = 0,
        suspicious_api_count: int = 0
    ) -> Dict[str, Any]:
        """
        Combines Isolation Forest ML inference with telecom domain rules.
        """
        ml_result = anomaly_engine.analyze_event(
            observed_rate=observed_rate,
            baseline_rate=baseline_rate,
            destination_service=destination_service,
            request_type=request_type,
            failed_auth_count=failed_auth_count,
            suspicious_api_count=suspicious_api_count
        )

        risk_level = ml_result["risk_level"]
        policy_info = TelecomRulesEngine.POLICY_MATRIX.get(risk_level, TelecomRulesEngine.POLICY_MATRIX["LOW"])

        return {
            **ml_result,
            "policy_rule": policy_info["policy"],
            "enforced_action": policy_info["action"]
        }

rules_engine = TelecomRulesEngine()
