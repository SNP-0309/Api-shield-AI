import axios from 'axios';

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade'
]);

function buildUpstreamUrl(req) {
  const configuredBase = process.env.UPSTREAM_URL;
  if (!configuredBase) return null;

  const base = new URL(configuredBase);
  const requestUrl = new URL(req.originalUrl, 'http://api-shield.gateway');
  const requestPath = requestUrl.pathname.replace(/^\/proxy(?=\/|$)/, '') || '/';
  const basePath = base.pathname.replace(/\/$/, '');

  base.pathname = `${basePath}${requestPath}`.replace(/\/\/+/g, '/');
  base.search = requestUrl.search;
  return base.toString();
}

function forwardedHeaders(req) {
  const headers = {};

  for (const [name, value] of Object.entries(req.headers)) {
    const normalized = name.toLowerCase();
    if (HOP_BY_HOP_HEADERS.has(normalized) || normalized === 'host' || normalized === 'content-length') {
      continue;
    }
    if (normalized === 'x-api-key' || normalized === 'x-admin-api-key') {
      continue;
    }
    headers[name] = value;
  }

  headers['x-forwarded-for'] = req.ip;
  headers['x-forwarded-proto'] = req.protocol;
  headers['x-forwarded-host'] = req.get('host');
  return headers;
}

function requestBody(req) {
  if (['GET', 'HEAD'].includes(req.method)) return undefined;

  // Parsed JSON/form requests are already buffered by Express. For other
  // content types, preserve the original stream (for example file uploads).
  if (req.body === undefined) {
    const declaredLength = Number(req.headers['content-length'] || 0);
    return declaredLength > 0 || req.headers['transfer-encoding'] ? req : undefined;
  }

  if (req.is('application/x-www-form-urlencoded')) {
    return new URLSearchParams(req.body).toString();
  }

  return req.body;
}

export const proxyController = {
  async forward(req, res) {
    const upstreamUrl = buildUpstreamUrl(req);
    if (!upstreamUrl) {
      return res.status(503).json({
        error: 'The gateway upstream is not configured',
        hint: 'Set UPSTREAM_URL to the service that should receive proxied API traffic'
      });
    }

    try {
      const upstreamResponse = await axios.request({
        url: upstreamUrl,
        method: req.method,
        headers: forwardedHeaders(req),
        data: requestBody(req),
        responseType: 'stream',
        timeout: Number(process.env.UPSTREAM_TIMEOUT_MS || 15000),
        maxContentLength: Number(process.env.UPSTREAM_MAX_RESPONSE_BYTES || 10 * 1024 * 1024),
        maxBodyLength: Number(process.env.UPSTREAM_MAX_REQUEST_BYTES || 2 * 1024 * 1024),
        validateStatus: () => true
      });

      for (const [name, value] of Object.entries(upstreamResponse.headers)) {
        if (!HOP_BY_HOP_HEADERS.has(name.toLowerCase()) && value !== undefined) {
          res.setHeader(name, value);
        }
      }

      res.status(upstreamResponse.status);
      upstreamResponse.data.on('error', (error) => {
        if (!res.headersSent) {
          res.status(502).json({ error: 'Upstream response stream failed' });
        } else {
          res.destroy(error);
        }
      });
      upstreamResponse.data.pipe(res);
    } catch (error) {
      if (error.response) {
        return res.status(502).json({ error: 'Upstream service request failed' });
      }
      return res.status(502).json({ error: 'Upstream service is unavailable' });
    }
  }
};
