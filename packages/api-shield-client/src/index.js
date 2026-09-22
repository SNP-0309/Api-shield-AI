function normalisePrefix(prefix) {
  const value = String(prefix || '/proxy').trim();
  if (!value.startsWith('/')) return `/${value}`;
  return value.replace(/\/$/, '') || '/proxy';
}

function normalisePath(path, prefix) {
  if (typeof path !== 'string' || !path.startsWith('/')) {
    throw new TypeError('API Shield request paths must start with /.');
  }
  if (path === prefix || path.startsWith(`${prefix}/`)) return path;
  return `${prefix}${path}`;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype;
}

export function createApiShieldUrl(gatewayUrl, path, upstreamPrefix = '/proxy') {
  if (!gatewayUrl) throw new Error('gatewayUrl is required');
  const base = String(gatewayUrl).replace(/\/$/, '');
  const prefix = normalisePrefix(upstreamPrefix);
  return `${base}${normalisePath(path, prefix)}`;
}

export function createApiShieldClient({
  gatewayUrl,
  apiKey,
  upstreamPrefix = '/proxy',
  defaultHeaders = {},
  credentials = 'include',
  fetchImpl = globalThis.fetch
} = {}) {
  if (!gatewayUrl) throw new Error('gatewayUrl is required');
  if (typeof fetchImpl !== 'function') throw new Error('A fetch implementation is required');

  async function request(path, options = {}) {
    const headers = new Headers({ ...defaultHeaders, ...(options.headers || {}) });
    if (apiKey && !headers.has('X-API-Key')) headers.set('X-API-Key', apiKey);

    let body = options.body;
    if (isPlainObject(body)) {
      body = JSON.stringify(body);
      if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    }

    return fetchImpl(createApiShieldUrl(gatewayUrl, path, upstreamPrefix), {
      ...options,
      headers,
      body,
      credentials: options.credentials || credentials
    });
  }

  async function json(path, options = {}) {
    const response = await request(path, options);
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const error = new Error(data?.error || `API Shield request failed with HTTP ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }
    return data;
  }

  return {
    request,
    json,
    get: (path, options = {}) => request(path, { ...options, method: 'GET' }),
    post: (path, body, options = {}) => request(path, { ...options, method: 'POST', body }),
    put: (path, body, options = {}) => request(path, { ...options, method: 'PUT', body }),
    patch: (path, body, options = {}) => request(path, { ...options, method: 'PATCH', body }),
    delete: (path, options = {}) => request(path, { ...options, method: 'DELETE' })
  };
}

export default createApiShieldClient;
