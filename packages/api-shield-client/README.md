# api-shield-client

Route real application API requests through API Shield so they can be observed, scored, rate-limited, and blocked when behavior becomes risky.

## Install

```bash
npm install api-shield-client
```

For local development from this repository:

```bash
npm install ../packages/api-shield-client
```

## Usage

```js
import createApiShieldClient from 'api-shield-client';

const api = createApiShieldClient({
  gatewayUrl: import.meta.env.VITE_API_SHIELD_URL,
  apiKey: import.meta.env.VITE_API_SHIELD_CLIENT_KEY
});

const response = await api.get('/api/health');
const data = await response.json();
```

The request is sent through `/proxy/api/health`, then API Shield forwards it to the protected upstream application configured in the dashboard.

The package does not create fake telemetry. Every dashboard event comes from a real application request.
