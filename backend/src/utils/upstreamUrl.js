import net from 'node:net';

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  '127.0.0.1',
  '::1',
  '0.0.0.0',
  'metadata.google.internal',
  'metadata.google.com'
]);

function isPrivateIp(hostname) {
  const ipVersion = net.isIP(hostname);
  if (ipVersion === 4) {
    const [a, b] = hostname.split('.').map(Number);
    return a === 10 || a === 127 || a === 169 && b === 254 || a === 192 && b === 168 || a === 172 && b >= 16 && b <= 31;
  }
  return ipVersion === 6 && (hostname === '::1' || hostname.startsWith('fc') || hostname.startsWith('fd') || hostname.startsWith('fe80:'));
}

export function validateUpstreamUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) throw new Error('An upstream URL is required');
  if (raw.length > 2048) throw new Error('The upstream URL is too long');

  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error('Enter a complete URL, for example https://resume-analyzer.example.com');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('The upstream URL must use HTTP or HTTPS');
  }
  if (parsed.username || parsed.password) {
    throw new Error('Credentials are not allowed in the upstream URL');
  }
  if (parsed.search || parsed.hash) {
    throw new Error('Query parameters and fragments are not allowed in the upstream URL');
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:' && process.env.ALLOW_HTTP_UPSTREAM !== 'true') {
    throw new Error('Production upstream URLs must use HTTPS');
  }
  if (process.env.NODE_ENV === 'production' && (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith('.local') || isPrivateIp(hostname))) {
    throw new Error('Private and local upstream hosts are not allowed in production');
  }

  const allowedHosts = String(process.env.UPSTREAM_ALLOWED_HOSTS || '')
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
  if (allowedHosts.length > 0 && !allowedHosts.includes(hostname)) {
    throw new Error('This upstream host is not in UPSTREAM_ALLOWED_HOSTS');
  }

  return parsed.toString().replace(/\/$/, '');
}
