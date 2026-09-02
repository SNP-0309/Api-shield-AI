import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import uvicorn
from ml_model import SentinelIsolationForest

app = FastAPI(
    title="API Shield ML Inference Service",
    description="Isolation Forest Anomaly Detection Microservice for Behavioral API Rate Limiting",
    version="1.0.0"
)

# Load model and scaler from models/
current_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.getenv("MODEL_PATH", os.path.join(current_dir, "models", "model.pkl"))
scaler_path = os.getenv("SCALER_PATH", os.path.join(current_dir, "models", "scaler.pkl"))

model_engine = SentinelIsolationForest(model_path=model_path, scaler_path=scaler_path)

class TrafficFeatures(BaseModel):
    requests_per_minute: float = Field(..., ge=0, description="Requests in sliding 60-second window")
    average_request_interval: float = Field(..., ge=0, description="Mean time (seconds) between requests")
    request_interval_std: float = Field(..., ge=0, description="Standard deviation of request intervals")
    average_payload_size: float = Field(..., ge=0, description="Mean payload size in bytes")
    payload_size_std: float = Field(..., ge=0, description="Standard deviation of payload sizes")
    unique_endpoint_count: float = Field(..., ge=0, description="Count of distinct endpoints accessed")
    endpoint_repetition_ratio: float = Field(..., ge=0, le=1, description="Dominant endpoint count / total requests")
    error_rate: float = Field(..., ge=0, le=1, description="Ratio of non-2xx/3xx HTTP responses")
    GET_ratio: float = Field(..., ge=0, le=1, description="Ratio of GET requests")
    POST_ratio: float = Field(..., ge=0, le=1, description="Ratio of POST requests")
    user_agent_change_rate: float = Field(..., ge=0, le=1, description="Frequency of user agent header shifts")
    burst_score: float = Field(..., ge=0, le=1, description="Peak sub-second burst intensity")
    endpoint_entropy: float = Field(..., ge=0, description="Shannon entropy of endpoint distribution")

class AnomalyResponse(BaseModel):
    anomalyScore: float = Field(..., description="Normalized risk contribution 0.0 (safe) to 1.0 (anomalous)")
    classification: str = Field(..., description="'normal' or 'anomalous'")
    rawScore: float = Field(..., description="Raw Isolation Forest decision function")

@app.get("/health")
def health_check():
    is_loaded = (model_engine.model is not None and model_engine.scaler is not None)
    return {
        "status": "ready" if is_loaded else "degraded",
        "modelLoaded": is_loaded,
        "service": "API Shield ML",
        "engine": "Isolation Forest"
    }

@app.get("/ready")
def readiness_check():
    if model_engine.model is None or model_engine.scaler is None:
        raise HTTPException(status_code=503, detail="Model artifacts are unavailable")
    return {"status": "ready", "service": "API Shield ML"}

@app.post("/predict", response_model=AnomalyResponse)
def predict_anomaly(features: TrafficFeatures):
    try:
        data_dict = features.model_dump()
        result = model_engine.predict(data_dict)
        return result
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference failed: {str(e)}")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    print(f"[+] Starting API Shield ML Inference Service on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)
