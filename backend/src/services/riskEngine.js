/**
 * Risk Engine combining ML Anomaly Score, Behavioral Heuristics, and Rate Velocity
 */
export const riskEngine = {
  /**
   * Calculate behavioral risk component from heuristic rules [0.0 - 1.0]
   */
  calculateBehaviorRisk(features) {
    let risk = 0.05; // baseline benign

    // If human variance is present (std > 1.0s) and error rate is low, strongly discount risk
    if (features.request_interval_std >= 1.0 && features.error_rate <= 0.10) {
      risk = 0.05;
    }

    // Low-and-slow indicator: extremely regular interval std (< 0.08s) with repeated access
    if (features.request_interval_std < 0.05 && features.requests_per_minute >= 3) {
      risk += 0.45;
    } else if (features.request_interval_std < 0.10 && features.requests_per_minute >= 3) {
      risk += 0.25;
    }

    // High endpoint repetition
    if (features.endpoint_repetition_ratio >= 0.90) {
      risk += 0.25;
    } else if (features.endpoint_repetition_ratio >= 0.70) {
      risk += 0.10;
    }

    // High error rate (probing or brute force)
    if (features.error_rate >= 0.50) {
      risk += 0.35;
    } else if (features.error_rate >= 0.25) {
      risk += 0.15;
    }

    // High burst activity
    if (features.burst_score >= 0.60) {
      risk += 0.25;
    }

    // Rapid User-Agent change
    if (features.user_agent_change_rate >= 0.25) {
      risk += 0.20;
    }

    // Extremely low entropy with repeated requests
    if (features.endpoint_entropy < 0.20 && features.requests_per_minute >= 4) {
      risk += 0.15;
    }

    return Math.min(1.0, Math.max(0.0, risk));
  },

  /**
   * Calculate rate velocity risk [0.0 - 1.0]
   */
  calculateRateRisk(rpm) {
    if (rpm < 30) return 0.05;
    if (rpm < 60) return 0.25;
    if (rpm < 100) return 0.50;
    if (rpm < 150) return 0.80;
    return 1.0;
  },

  /**
   * Determine dominant behavior label
   */
  determineDominantBehavior(features, finalRisk) {
    if (finalRisk < 0.30) {
      return 'Human-like';
    }
    if (features.request_interval_std < 0.06 && features.endpoint_repetition_ratio >= 0.85) {
      return 'Low-and-Slow Bot';
    }
    if (features.POST_ratio >= 0.80 && features.error_rate >= 0.40) {
      return 'Brute Force Attempt';
    }
    if (features.burst_score >= 0.50) {
      return 'Burst Attack';
    }
    if (features.unique_endpoint_count >= 6 && features.GET_ratio >= 0.85) {
      return 'API Scraper';
    }
    if (features.error_rate >= 0.50) {
      return 'Endpoint Probing';
    }
    return 'Suspicious Automation';
  },

  /**
   * Compute final risk and map to Security Level & Dynamic Limit
   */
  evaluateRisk(mlAnomalyScore, features) {
    const behaviorRisk = this.calculateBehaviorRisk(features);
    const rateRisk = this.calculateRateRisk(features.requests_per_minute);

    // Prompt formula:
    // finalRisk = 0.65 * anomalyScore + 0.20 * behaviorRisk + 0.15 * rateRisk
    const rawRisk = (0.65 * mlAnomalyScore) + (0.20 * behaviorRisk) + (0.15 * rateRisk);
    const finalRisk = Number(Math.min(1.0, Math.max(0.0, rawRisk)).toFixed(3));

    let securityLevel;
    let dynamicLimit;
    let action;

    if (finalRisk < 0.30) {
      securityLevel = 'SAFE';
      dynamicLimit = 100;
      action = 'ALLOWED';
    } else if (finalRisk < 0.60) {
      securityLevel = 'SUSPICIOUS';
      dynamicLimit = 50;
      action = 'ALLOWED';
    } else if (finalRisk < 0.80) {
      securityLevel = 'HIGH_RISK';
      dynamicLimit = 15;
      action = 'THROTTLED';
    } else {
      securityLevel = 'CRITICAL';
      dynamicLimit = 5;
      action = 'BLOCKED';
    }

    const dominantBehavior = this.determineDominantBehavior(features, finalRisk);

    return {
      finalRisk,
      mlAnomalyScore,
      behaviorRisk: Number(behaviorRisk.toFixed(3)),
      rateRisk: Number(rateRisk.toFixed(3)),
      securityLevel,
      dynamicLimit,
      action,
      dominantBehavior
    };
  }
};
