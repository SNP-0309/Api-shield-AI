function calculateStd(values, mean) {
  if (!values || values.length <= 1) return 0;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function calculateEntropy(items) {
  if (!items || items.length === 0) return 0;

  const counts = {};
  for (const item of items) counts[item] = (counts[item] || 0) + 1;

  return Object.values(counts).reduce((entropy, count) => {
    const probability = count / items.length;
    return entropy - (probability > 0 ? probability * Math.log2(probability) : 0);
  }, 0);
}

function emptyFeatures() {
  return {
    requests_per_minute: 0,
    average_request_interval: 0,
    request_interval_std: 0,
    average_payload_size: 0,
    payload_size_std: 0,
    unique_endpoint_count: 0,
    endpoint_repetition_ratio: 0,
    error_rate: 0,
    GET_ratio: 0,
    POST_ratio: 0,
    user_agent_change_rate: 0,
    burst_score: 0,
    endpoint_entropy: 0
  };
}

/**
 * Extract behavioral features from observations in the last 60 seconds.
 * Missing observations remain zero; no synthetic client behavior is inserted.
 */
export function extractBehavioralFeatures(history = {}) {
  const timestamps = history.timestamps || [];
  const cutoff = Date.now() - 60 * 1000;
  const recentIndexes = timestamps
    .map((timestamp, index) => ({ timestamp: Number(timestamp), index }))
    .filter(({ timestamp }) => Number.isFinite(timestamp) && timestamp >= cutoff)
    .map(({ index }) => index);

  const total = recentIndexes.length;
  if (total === 0) return emptyFeatures();

  const getAt = (values = [], index) => values[index];
  const recentTimestamps = recentIndexes.map((index) => Number(getAt(timestamps, index)));
  const endpoints = recentIndexes.map((index) => getAt(history.endpoints, index) || '/');
  const payloads = recentIndexes.map((index) => Number(getAt(history.payloads, index) || 0));
  const methods = recentIndexes.map((index) => String(getAt(history.methods, index) || 'GET').toUpperCase());
  const errors = recentIndexes.map((index) => Number(getAt(history.errors, index) || 0));
  const useragents = recentIndexes.map((index) => getAt(history.useragents, index) || 'Unknown');

  const intervals = [];
  let burstCount = 0;
  for (let index = 1; index < recentTimestamps.length; index += 1) {
    const interval = Math.max(0.001, (recentTimestamps[index] - recentTimestamps[index - 1]) / 1000);
    intervals.push(interval);
    if (interval < 0.25) burstCount += 1;
  }

  const averageInterval = intervals.length > 0
    ? intervals.reduce((sum, value) => sum + value, 0) / intervals.length
    : 0;
  const intervalStd = calculateStd(intervals, averageInterval);
  const observedDuration = recentTimestamps.length > 1
    ? Math.max(1, (recentTimestamps.at(-1) - recentTimestamps[0]) / 1000)
    : 60;
  const requestsPerMinute = (total / Math.min(60, observedDuration)) * 60;

  const averagePayload = payloads.reduce((sum, value) => sum + value, 0) / total;
  const payloadStd = calculateStd(payloads, averagePayload);

  const endpointCounts = {};
  for (const endpoint of endpoints) endpointCounts[endpoint] = (endpointCounts[endpoint] || 0) + 1;
  const maxEndpointCount = Math.max(...Object.values(endpointCounts));

  const getCount = methods.filter((method) => method === 'GET').length;
  const postCount = methods.filter((method) => method === 'POST').length;
  const errorCount = errors.filter((error) => error === 1).length;
  let userAgentChanges = 0;
  for (let index = 1; index < useragents.length; index += 1) {
    if (useragents[index] !== useragents[index - 1]) userAgentChanges += 1;
  }

  return {
    requests_per_minute: Number(requestsPerMinute.toFixed(2)),
    average_request_interval: Number(averageInterval.toFixed(3)),
    request_interval_std: Number(intervalStd.toFixed(4)),
    average_payload_size: Number(averagePayload.toFixed(2)),
    payload_size_std: Number(payloadStd.toFixed(2)),
    unique_endpoint_count: Object.keys(endpointCounts).length,
    endpoint_repetition_ratio: Number((maxEndpointCount / total).toFixed(3)),
    error_rate: Number((errorCount / total).toFixed(3)),
    GET_ratio: Number((getCount / total).toFixed(3)),
    POST_ratio: Number((postCount / total).toFixed(3)),
    user_agent_change_rate: Number((userAgentChanges / Math.max(1, total - 1)).toFixed(3)),
    burst_score: Number((intervals.length ? burstCount / intervals.length : 0).toFixed(3)),
    endpoint_entropy: Number(calculateEntropy(endpoints).toFixed(3))
  };
}
