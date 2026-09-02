import { redisService } from '../services/redisService.js';
import { behaviorService } from '../services/behaviorService.js';
import { mlService } from '../services/mlService.js';

export const dashboardController = {
  /**
   * GET /security/overview
   */
  async getOverview(req, res) {
    try {
      const clients = await redisService.getAllActiveClients();
      const recentEvents = await redisService.getRecentTraffic(100);
      const metrics = await redisService.getMetrics();
      const isMlOnline = await mlService.checkHealth();
      const isRedisOnline = redisService.isOnline();

      let safeCount = 0;
      let suspiciousCount = 0;
      let highRiskCount = 0;
      let criticalCount = 0;
      let totalRisk = 0;
      let totalRequests = 0;

      clients.forEach((c) => {
        totalRequests += c.requests || 0;
        totalRisk += c.riskScore || 0;

        if (c.status === 'SAFE') safeCount++;
        else if (c.status === 'SUSPICIOUS') suspiciousCount++;
        else if (c.status === 'HIGH_RISK') highRiskCount++;
        else if (c.status === 'CRITICAL') criticalCount++;
      });

      const activeClients = clients.length;
      const averageRisk = activeClients > 0 ? Number((totalRisk / activeClients).toFixed(2)) : 0;

      res.json({
        totalRequests: metrics.totalRequests || Math.max(totalRequests, recentEvents.length),
        activeClients,
        safeClients: safeCount,
        suspiciousClients: suspiciousCount,
        highRiskClients: highRiskCount,
        blockedClients: criticalCount,
        blockedRequests: metrics.blockedRequests,
        averageRisk,
        mlEngineOnline: isMlOnline,
        redisOnline: isRedisOnline
      });
    } catch (err) {
      console.error('[DashboardController] getOverview error:', err.message);
      res.status(500).json({ error: 'Failed to retrieve overview metrics' });
    }
  },

  /**
   * GET /security/clients
   */
  async getClients(req, res) {
    try {
      const clients = await redisService.getAllActiveClients();
      res.json(clients);
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve active clients' });
    }
  },

  /**
   * GET /security/traffic
   */
  async getTraffic(req, res) {
    try {
      const requestedLimit = Number.parseInt(req.query.limit || '50', 10);
      const limit = Number.isFinite(requestedLimit) ? Math.min(200, Math.max(1, requestedLimit)) : 50;
      const traffic = await redisService.getRecentTraffic(limit);
      res.json(traffic);
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve traffic stream' });
    }
  },

  /**
   * GET /security/timeseries
   */
  async getTimeseries(req, res) {
    try {
      const events = await redisService.getRecentTraffic(150);
      // Group events into 5-second bins over recent minutes
      const bins = {};
      const now = Date.now();

      // Initialize last 10 bins (past 50 seconds)
      for (let i = 9; i >= 0; i--) {
        const binTime = new Date(now - i * 5000);
        const timeLabel = binTime.toTimeString().split(' ')[0];
        bins[timeLabel] = {
          time: timeLabel,
          normalCount: 0,
          threatCount: 0,
          avgRisk: 0.1,
          totalRiskSum: 0,
          count: 0
        };
      }

      // Populate with real events
      events.forEach((evt) => {
        const evtDate = new Date(evt.timestamp);
        // Find closest 5-second bucket
        const roundedTime = new Date(Math.floor(evtDate.getTime() / 5000) * 5000);
        const timeLabel = roundedTime.toTimeString().split(' ')[0];

        if (bins[timeLabel]) {
          bins[timeLabel].count++;
          bins[timeLabel].totalRiskSum += evt.riskScore;
          if (evt.riskScore >= 0.50 || evt.statusCode === 429) {
            bins[timeLabel].threatCount++;
          } else {
            bins[timeLabel].normalCount++;
          }
        }
      });

      const series = Object.values(bins).map((b) => ({
        time: b.time,
        normalTraffic: b.normalCount,
        threatTraffic: b.threatCount,
        averageRisk: b.count > 0 ? Number((b.totalRiskSum / b.count).toFixed(2)) : 0
      }));

      res.json(series);
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve timeseries data' });
    }
  },

  /**
   * GET /security/client/:id
   */
  async getClientDetails(req, res) {
    try {
      const clientId = decodeURIComponent(req.params.id);
      const history = await redisService.getClientHistory(clientId);
      const { features } = await behaviorService.getClientFeatures(clientId);

      const clients = await redisService.getAllActiveClients();
      const currentClient = clients.find((c) => c.clientId === clientId);
      if (!currentClient) {
        return res.status(404).json({ error: 'Client telemetry not found' });
      }

      // Generate deterministic explanation
      const explanation = behaviorService.generateExplanation(
        features,
        currentClient.status,
        currentClient.riskScore
      );

      // Find top endpoint
      const epCounts = {};
      (history.endpoints || []).forEach((ep) => {
        epCounts[ep] = (epCounts[ep] || 0) + 1;
      });
      let topEndpoint = '—';
      let maxCount = 0;
      for (const [ep, count] of Object.entries(epCounts)) {
        if (count > maxCount) {
          maxCount = count;
          topEndpoint = ep;
        }
      }

      res.json({
        clientId: currentClient.clientId,
        ip: currentClient.ip,
        userAgent: history.useragents[history.useragents.length - 1] || 'Unknown',
        lastSeen: currentClient.lastSeen,
        requests: currentClient.requests,
        riskScore: currentClient.riskScore,
        securityLevel: currentClient.status,
        action: currentClient.action,
        dynamicLimit: currentClient.dynamicLimit,
        dominantBehavior: currentClient.dominantBehavior,
        topEndpoint,
        features: {
          requestsPerMinute: features.requests_per_minute,
          averageInterval: `${features.average_request_interval}s`,
          intervalVariation: `${features.request_interval_std}s`,
          endpointRepetition: `${(features.endpoint_repetition_ratio * 100).toFixed(1)}%`,
          errorRate: `${(features.error_rate * 100).toFixed(1)}%`,
          averagePayload: `${features.average_payload_size} bytes`,
          payloadVariation: `${features.payload_size_std} bytes`,
          entropy: features.endpoint_entropy,
          burstScore: features.burst_score
        },
        explanation
      });
    } catch (err) {
      console.error('[DashboardController] getClientDetails error:', err.message);
      res.status(500).json({ error: 'Failed to retrieve client details' });
    }
  }
};
