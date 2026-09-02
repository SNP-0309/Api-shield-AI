import axios from 'axios';

let mlOnline = false;
let lastCheckTime = 0;

export const mlService = {
  /**
   * Check if ML service is reachable
   */
  async checkHealth() {
    const mlUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
    try {
      const res = await axios.get(`${mlUrl}/health`, { timeout: 1500 });
      mlOnline = res.data?.status === 'ready' && res.data?.modelLoaded === true;
      lastCheckTime = Date.now();
      return mlOnline;
    } catch {
      mlOnline = false;
      return false;
    }
  },

  isOnline() {
    return mlOnline;
  },

  /**
   * Send 13 features to Python ML service POST /predict
   * Use a bounded local decision when the model dependency is unavailable.
   */
  async predictAnomaly(features) {
    const mlUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
    try {
      const response = await axios.post(`${mlUrl}/predict`, features, {
        timeout: 2000,
        headers: { 'Content-Type': 'application/json' }
      });

      mlOnline = true;
      return {
        anomalyScore: Number(response.data.anomalyScore ?? 0.15),
        classification: response.data.classification || 'normal',
        rawScore: response.data.rawScore ?? 0.0,
        source: 'ml_service'
      };
    } catch (err) {
      mlOnline = false;
      // Degraded calculation directly in the gateway.
      let degradedScore = 0.15;

      // Detect low-and-slow behavior in the degraded decision path.
      if (features.request_interval_std < 0.05 && features.endpoint_repetition_ratio > 0.85) {
        degradedScore = 0.88;
      } else if (features.error_rate > 0.50 || features.burst_score > 0.60) {
        degradedScore = 0.82;
      } else if (features.requests_per_minute > 50) {
        degradedScore = 0.65;
      }

      return {
        anomalyScore: degradedScore,
        classification: degradedScore >= 0.5 ? 'anomalous' : 'normal',
        rawScore: 0.0,
        source: 'degraded_heuristic',
        reason: err.message
      };
    }
  }
};
