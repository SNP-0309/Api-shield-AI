import { redisService } from './redisService.js';
import { extractBehavioralFeatures } from '../utils/featureExtractor.js';

export const behaviorService = {
  /**
   * Get extracted behavioral features for client
   */
  async getClientFeatures(clientId) {
    const history = await redisService.getClientHistory(clientId);
    const features = extractBehavioralFeatures(history);
    return { features, historyLength: history.timestamps.length };
  },

  /**
   * Produce human-readable deterministic explanation for why client was flagged
   * As specified: Do NOT use an LLM for this explanation.
   */
  generateExplanation(features, securityLevel, riskScore) {
    if (securityLevel === 'SAFE') {
      return {
        summary: 'Behavior consistent with normal human API interaction.',
        details: [
          'High request interval variance (human browsing pattern)',
          'Natural distribution of accessed endpoints',
          'Low error rate and normal payload variation'
        ]
      };
    }

    const reasons = [];

    // 1. Low-and-slow check
    if (features.request_interval_std < 0.08 && features.requests_per_minute > 4) {
      reasons.push(`Unnaturally consistent request intervals (std: ${features.request_interval_std.toFixed(3)}s), characteristic of programmed timers.`);
    }

    // 2. High endpoint repetition
    if (features.endpoint_repetition_ratio >= 0.85) {
      reasons.push(`${(features.endpoint_repetition_ratio * 100).toFixed(0)}% of requests target the exact same endpoint repetitively.`);
    }

    // 3. Payload uniformity
    if (features.payload_size_std < 10 && features.requests_per_minute > 5) {
      reasons.push(`Near-zero payload variation (std: ${features.payload_size_std.toFixed(1)} bytes), indicating automated templated requests.`);
    }

    // 4. High error rate / probing / brute force
    if (features.error_rate >= 0.40) {
      reasons.push(`High failure rate (${(features.error_rate * 100).toFixed(0)}% 4xx/5xx responses), suggesting credential stuffing or route scanning.`);
    }

    // 5. Burst activity
    if (features.burst_score >= 0.50) {
      reasons.push(`High sub-second burst intensity (${(features.burst_score * 100).toFixed(0)}% sub-250ms arrivals), indicative of bot script execution.`);
    }

    // 6. Low entropy
    if (features.endpoint_entropy < 0.3 && features.requests_per_minute > 5) {
      reasons.push(`Extremely low endpoint entropy (${features.endpoint_entropy.toFixed(2)}), lacking natural multi-resource user navigation.`);
    }

    // 7. Rapid User-Agent rotation
    if (features.user_agent_change_rate > 0.2) {
      reasons.push(`Suspicious User-Agent rotation rate (${(features.user_agent_change_rate * 100).toFixed(0)}% shifts per request).`);
    }

    if (reasons.length === 0) {
      reasons.push('Behavioral profile deviates from the learned baseline model for legitimate user sessions.');
    }

    return {
      summary: `Client flagged by API Shield with ${securityLevel} threat posture (Risk: ${(riskScore * 100).toFixed(0)}%).`,
      details: reasons
    };
  }
};
