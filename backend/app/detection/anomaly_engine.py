import numpy as np
from sklearn.ensemble import IsolationForest
from app.detection.feature_extractor import TelecomFeatureExtractor

class TelecomAnomalyEngine:
    """
    Lightweight, production-grade unsupervised anomaly detection engine
    implementing an Isolation Forest trained on baseline telecom traffic vectors.
    """
    def __init__(self):
        self.model_type = "IsolationForest (scikit-learn)"
        self.n_estimators = 100
        self.contamination = 0.08
        self.features_list = [
            "norm_rate",
            "rate_deviation",
            "endpoint_sensitivity",
            "request_weight",
            "norm_auth_fail",
            "norm_api_suspicion"
        ]
        self.is_trained = False
        self.model = IsolationForest(
            n_estimators=self.n_estimators,
            contamination=self.contamination,
            random_state=42
        )
        self._initialize_baseline_model()

    def _initialize_baseline_model(self):
        """
        Fits the Isolation Forest on a controlled synthetic baseline distribution
        representing normal operating parameters for cloud-native telecom network functions.
        """
        np.random.seed(42)
        n_samples = 1200
        
        # Normal traffic characteristics:
        # 1. Normal rates (3 to 18 req/s normalized to 150) -> ~0.02 - 0.12
        normal_rate = np.random.uniform(0.02, 0.15, n_samples)
        # 2. Minimal deviation from baseline (0.0 to 0.40)
        rate_deviation = np.random.uniform(0.0, 0.35, n_samples)
        # 3. Distributed endpoint sensitivities
        endpoint_sensitivity = np.random.choice([0.4, 0.5, 0.6, 0.7, 0.8], size=n_samples)
        # 4. Standard request weights
        request_weight = np.random.choice([0.15, 0.20, 0.25, 0.35, 0.40], size=n_samples)
        # 5. Auth failures close to zero in baseline
        auth_failures = np.random.exponential(scale=0.02, size=n_samples).clip(0.0, 0.1)
        # 6. API suspicion zero in baseline
        api_suspicion = np.random.exponential(scale=0.01, size=n_samples).clip(0.0, 0.05)

        X_baseline = np.column_stack([
            normal_rate,
            rate_deviation,
            endpoint_sensitivity,
            request_weight,
            auth_failures,
            api_suspicion
        ])

        self.model.fit(X_baseline)
        self.is_trained = True

    def analyze_event(
        self,
        observed_rate: float,
        baseline_rate: float,
        destination_service: str,
        request_type: str,
        failed_auth_count: int = 0,
        suspicious_api_count: int = 0
    ) -> dict:
        """
        Evaluates an individual telemetry event against the trained Isolation Forest
        and computes a composite risk score and human-readable explanation.
        """
        extracted = TelecomFeatureExtractor.extract_features(
            observed_rate=observed_rate,
            baseline_rate=baseline_rate,
            destination_service=destination_service,
            request_type=request_type,
            failed_auth_count=failed_auth_count,
            suspicious_api_count=suspicious_api_count
        )

        vector = extracted["feature_vector"].reshape(1, -1)
        
        # Scikit-learn raw decision function: positive = normal, negative = anomaly
        decision_score = float(self.model.decision_function(vector)[0])
        is_ml_anomaly = bool(self.model.predict(vector)[0] == -1)

        # Calculate a calibrated 0-100 continuous risk score
        # Base risk from Isolation Forest decision score (typical range -0.3 to +0.3)
        ml_risk_component = max(0.0, min(100.0, (0.25 - decision_score) * 160.0))

        # Domain heuristic penalties
        rate_penalty = min(50.0, (extracted["rate_deviation_percent"] / 100.0) * 12.0)
        auth_penalty = min(40.0, failed_auth_count * 5.0)
        api_penalty = min(40.0, suspicious_api_count * 7.5)

        # Baseline composite calculation
        composite_risk = (0.40 * ml_risk_component) + (0.60 * (rate_penalty + auth_penalty + api_penalty))
        
        # Acute surge triggers
        if observed_rate >= 80.0 or (failed_auth_count >= 15 and observed_rate >= 40.0):
            composite_risk = max(composite_risk, 85.0)
        elif observed_rate >= 40.0 or failed_auth_count >= 8:
            composite_risk = max(composite_risk, 65.0)

        composite_risk = min(100.0, max(0.0, composite_risk))
        composite_risk = round(composite_risk, 1)

        # Risk Classification
        if composite_risk >= 80.0:
            risk_level = "CRITICAL"
            classification = "MALICIOUS"
            action = "BLOCK"
            decision = "CONTAIN"
        elif composite_risk >= 60.0:
            risk_level = "HIGH"
            classification = "ANOMALY"
            action = "RATE_LIMIT"
            decision = "RATE_LIMIT"
        elif composite_risk >= 35.0:
            risk_level = "MEDIUM"
            classification = "SUSPICIOUS"
            action = "FLAG_AND_MONITOR"
            decision = "MONITOR"
        else:
            risk_level = "LOW"
            classification = "NORMAL"
            action = "ALLOW"
            decision = "ALLOW"

        # Generate human-readable explanation
        observation, reason, recommendation = self._generate_explanation(
            observed_rate=observed_rate,
            baseline_rate=baseline_rate,
            deviation_percent=extracted["rate_deviation_percent"],
            failed_auth_count=failed_auth_count,
            suspicious_api_count=suspicious_api_count,
            risk_level=risk_level,
            request_type=request_type,
            destination_service=destination_service
        )

        return {
            "risk_score": composite_risk,
            "risk_level": risk_level,
            "classification": classification,
            "action": action,
            "decision": decision,
            "is_anomaly": is_ml_anomaly,
            "decision_score": round(decision_score, 4),
            "rate_deviation_percent": extracted["rate_deviation_percent"],
            "observation": observation,
            "reason": reason,
            "recommended_action": recommendation,
            "detection_method": "Isolation Forest (ML) + Telecom Risk Model",
            "model_metadata": {
                "algorithm": self.model_type,
                "n_estimators": self.n_estimators,
                "contamination": self.contamination,
                "features_used": self.features_list
            }
        }

    def _generate_explanation(
        self,
        observed_rate: float,
        baseline_rate: float,
        deviation_percent: float,
        failed_auth_count: int,
        suspicious_api_count: int,
        risk_level: str,
        request_type: str,
        destination_service: str
    ) -> tuple:
        if risk_level == "CRITICAL":
            obs = f"Critical volumetric anomaly detected on {destination_service} ({observed_rate:.1f} req/s vs baseline {baseline_rate:.1f} req/s, +{deviation_percent:.0f}%)."
            reason = f"High-velocity traffic burst exceeding ingress queue threshold combined with pattern anomalies. Potential distributed denial-of-service vector against telecom core."
            rec = "Enforce immediate ingress rate-capping, route through scrubbing filter, and isolate originating subnet at edge proxy."
        elif risk_level == "HIGH":
            if failed_auth_count > 3:
                obs = f"Authentication flood with {failed_auth_count} repeated credential handshake rejections targeting {destination_service}."
                reason = f"Source device generated rapid consecutive authentication attempts at {observed_rate:.1f} req/s (+{deviation_percent:.0f}% above baseline), characteristic of credential stuffing."
                rec = "Apply progressive rate limiting (HTTP 429), require cryptographic challenge re-negotiation, and quarantine session state."
            else:
                obs = f"High rate deviation (+{deviation_percent:.0f}%) observed on {destination_service}."
                reason = f"Traffic profile diverges significantly from baseline cluster behavior identified by the Isolation Forest model."
                rec = "Throttle bandwidth allocation to the offending UE / client identifier and inspect active bearers."
        elif risk_level == "MEDIUM":
            obs = f"Elevated request rate or non-standard payload flags on {destination_service}."
            reason = f"Request velocity is {deviation_percent:.0f}% higher than baseline expectations; partial heuristic threshold flags raised."
            rec = "Flag device identifier for priority auditing and increase telemetry logging resolution."
        else:
            obs = f"Operational telemetry within expected distribution boundaries ({observed_rate:.1f} req/s)."
            reason = f"Observed features conform to typical {request_type} patterns across 3GPP cloud-native network functions."
            rec = "Maintain standard telemetry stream and allow standard bearer routing."

        return obs, reason, rec

# Singleton instance
anomaly_engine = TelecomAnomalyEngine()
