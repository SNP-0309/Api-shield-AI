import numpy as np
import joblib

FEATURE_NAMES = [
    "requests_per_minute",
    "average_request_interval",
    "request_interval_std",
    "average_payload_size",
    "payload_size_std",
    "unique_endpoint_count",
    "endpoint_repetition_ratio",
    "error_rate",
    "GET_ratio",
    "POST_ratio",
    "user_agent_change_rate",
    "burst_score",
    "endpoint_entropy"
]

class SentinelIsolationForest:
    def __init__(self, model_path="models/model.pkl", scaler_path="models/scaler.pkl"):
        self.model_path = model_path
        self.scaler_path = scaler_path
        self.model = None
        self.scaler = None
        self.load()

    def load(self):
        try:
            self.model = joblib.load(self.model_path)
            self.scaler = joblib.load(self.scaler_path)
            return True
        except Exception as e:
            print(f"[!] Model artifacts unavailable ({e}). The service will report degraded readiness.")
            return False

    def normalize_score(self, raw_decision):
        """
        Convert Isolation Forest decision_function value to an intuitive normalized [0.0, 1.0] anomaly score.
        raw_decision in scikit-learn:
          > 0 (positive): inliers (normal) -> should map to LOW anomaly score (0.05 - 0.25)
          ~ 0 (zero): decision boundary -> maps to ~ 0.50
          < 0 (negative): outliers (anomalous) -> should map to HIGH anomaly score (0.75 - 0.98)
        """
        # Isolation Forest's decision boundary is approximately zero: positive
        # values are inliers and negative values are outliers. A sigmoid keeps
        # the score bounded while preserving this model-independent ordering.
        z = np.clip(12.0 * raw_decision, -15.0, 15.0)
        score = 1.0 / (1.0 + np.exp(z))
        return float(np.clip(score, 0.0, 1.0))

    def predict(self, feature_dict):
        """
        Takes dictionary of 13 features, scales them, and returns:
        {
            "anomalyScore": float (0.0 to 1.0),
            "classification": "normal" | "anomalous",
            "rawScore": float
        }
        """
        if self.model is None or self.scaler is None:
            raise RuntimeError("Model artifacts are unavailable")

        # Vectorize features in exact order
        vec = np.array([[feature_dict.get(col, 0.0) for col in FEATURE_NAMES]])
        scaled_vec = self.scaler.transform(vec)
        raw_decision = float(self.model.decision_function(scaled_vec)[0])
        anomaly_score = self.normalize_score(raw_decision)
        classification = "anomalous" if anomaly_score >= 0.50 else "normal"

        return {
            "anomalyScore": round(anomaly_score, 4),
            "classification": classification,
            "rawScore": round(raw_decision, 4)
        }
