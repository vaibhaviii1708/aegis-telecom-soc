import numpy as np

# Sensitivity scoring for 3GPP cloud-native network functions and endpoints
ENDPOINT_SENSITIVITY = {
    "Auth Service (AMF)": 0.85,
    "Session Mgmt (SMF)": 0.70,
    "User Plane Function (UPF)": 0.50,
    "Network Exposure Function (NEF)": 0.90,
    "Telecom Core API": 0.80,
    "Ingress Gateway": 0.60,
    "SMS Router": 0.40,
    "Billing & Charging (CHF)": 0.75,
}

REQUEST_TYPE_RISK_BASE = {
    "REGISTER_USER": 0.40,
    "AUTHENTICATE_DEVICE": 0.60,
    "VOICE_CALL": 0.20,
    "SMS_REQUEST": 0.25,
    "DATA_SESSION": 0.15,
    "API_REQUEST": 0.50,
    "HANDOVER_REQUEST": 0.35,
}

class TelecomFeatureExtractor:
    """
    Extracts statistical and domain-specific features from incoming telecom
    application events to serve both machine learning models and rule-based detectors.
    """
    
    @staticmethod
    def extract_features(
        observed_rate: float,
        baseline_rate: float,
        destination_service: str,
        request_type: str,
        failed_auth_count: int = 0,
        suspicious_api_count: int = 0
    ) -> dict:
        base_rate = max(1.0, baseline_rate)
        rate_deviation = max(0.0, (observed_rate - base_rate) / base_rate)
        
        endpoint_weight = ENDPOINT_SENSITIVITY.get(destination_service, 0.50)
        req_type_weight = REQUEST_TYPE_RISK_BASE.get(request_type, 0.30)
        
        # Normalized metrics between 0.0 and 1.0
        norm_rate = min(1.0, observed_rate / 150.0)
        norm_auth_fail = min(1.0, failed_auth_count / 20.0)
        norm_api_suspicion = min(1.0, suspicious_api_count / 10.0)
        
        feature_vector = np.array([
            norm_rate,
            rate_deviation,
            endpoint_weight,
            req_type_weight,
            norm_auth_fail,
            norm_api_suspicion
        ], dtype=np.float32)

        return {
            "feature_vector": feature_vector,
            "rate_deviation_percent": round(rate_deviation * 100.0, 1),
            "endpoint_sensitivity": endpoint_weight,
            "request_weight": req_type_weight,
            "norm_auth_fail": norm_auth_fail,
            "norm_api_suspicion": norm_api_suspicion
        }
