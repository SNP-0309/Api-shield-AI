# API Shield Traffic Testing Guide

This guide tests API Shield with a public test API. It does not add demo data to the product. Every dashboard event is created by a real request sent through the gateway.

## Test setup

Start the ML service, backend, and frontend as described in the README. Redis is recommended because it keeps the telemetry and client history. For local testing without Redis, set `ALLOW_IN_MEMORY_FALLBACK=true` in `.env`.

In the API Shield dashboard, open **Settings → Protected Application** and save:

```text
https://dummyjson.com
```

DummyJSON is a public fake REST API intended for testing and prototyping. It provides a test route, user data, and sample authentication: [dummyjson.com/docs](https://dummyjson.com/docs).

The commands below assume the gateway is running at `http://localhost:5000` and use the client API key configured in `SENTINEL_API_KEYS`.

```powershell
$gateway = "http://localhost:5000"
$headers = @{ "X-API-Key" = "client-test-key" }
```

If the gateway is deployed, replace `$gateway` with its public URL. Do not send test requests directly to DummyJSON; use `$gateway/proxy/...` so API Shield can observe them.

## 1. Normal / safe traffic

Send a few requests slowly to different endpoints:

```powershell
Invoke-RestMethod -Uri "$gateway/proxy/test" -Headers $headers

Start-Sleep -Seconds 3

Invoke-RestMethod -Uri "$gateway/proxy/users?limit=5" -Headers $headers

Start-Sleep -Seconds 3

Invoke-RestMethod -Uri "$gateway/proxy/products?limit=5" -Headers $headers
```

This should normally be classified as `SAFE` because the traffic is slow and varied.

## 2. Suspicious traffic

Send the same endpoint repeatedly at a regular interval:

```powershell
$headers = @{ "X-API-Key" = "suspicious-test-key" }

1..8 | ForEach-Object {
  Invoke-RestMethod -Uri "$gateway/proxy/users" -Headers $headers | Out-Null
  Start-Sleep -Milliseconds 500
}
```

This can produce a `SUSPICIOUS` posture because the client repeats the same behavior with very similar timing.

## 3. High-risk traffic

Send a fast burst of requests:

```powershell
$headers = @{ "X-API-Key" = "high-risk-test-key" }

1..25 | ForEach-Object {
  curl.exe -s -o NUL -w "%{http_code}`n" `
    -H "X-API-Key: high-risk-test-key" `
    "$gateway/proxy/users"
}
```

This can produce `HIGH_RISK`. The dynamic limit for high-risk clients is 15 requests per minute, so later requests may receive HTTP `429`.

## 4. Critical traffic

Send a fast burst to an endpoint that does not exist. The repeated errors make the behavior more suspicious:

```powershell
$headers = @{ "X-API-Key" = "critical-test-key" }

1..20 | ForEach-Object {
  curl.exe -s -o NUL -w "%{http_code}`n" `
    -H "X-API-Key: critical-test-key" `
    "$gateway/proxy/not-found-endpoint"
}
```

This can produce `CRITICAL`. Critical clients have a five-request-per-minute limit and can be blocked with HTTP `429`.

## Test login and authenticated traffic

DummyJSON provides sample login credentials. Send the login request through API Shield:

```powershell
$headers = @{ "X-API-Key" = "client-test-key" }
$body = @{
  username = "emilys"
  password = "emilyspass"
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri "$gateway/proxy/user/login" `
  -Headers $headers `
  -ContentType "application/json" `
  -Body $body
```

The login request is analyzed by API Shield, while the request body is forwarded to the upstream API.

## Check security headers

Use `Invoke-WebRequest` when you want to inspect the gateway’s response headers:

```powershell
$response = Invoke-WebRequest `
  -Uri "$gateway/proxy/test" `
  -Headers @{ "X-API-Key" = "client-test-key" }

$response.Headers["X-Sentinel-Level"]
$response.Headers["X-Sentinel-Risk"]
$response.Headers["X-Sentinel-Action"]
$response.Headers["RateLimit-Limit"]
$response.Headers["RateLimit-Remaining"]
```

## Check the dashboard

Open `http://localhost:5173` and review:

- **Overview** for totals and risk distribution
- **Live Traffic** for individual requests and status codes
- **Clients** for the client behavior profile
- **Threat Intelligence** for the classified posture

The dashboard refreshes telemetry every two seconds.

## Important notes

- Risk levels are calculated from traffic history; one request cannot reliably create a high-risk or critical profile.
- Use different test API keys for independent scenarios. Add comma-separated keys to `SENTINEL_API_KEYS` and restart the backend if needed.
- The exact posture can vary because the ML model and observed behavior both contribute to the final score.
- Use only APIs you own or are authorized to test. Do not point API Shield at Amazon, Flipkart, or another third-party production system without explicit permission.
