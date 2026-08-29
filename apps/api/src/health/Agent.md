# Health Module — Agent Help

## Overview
Simple health check endpoint to verify the API server is running.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Health check — returns status & timestamp |

## Architecture
- `HealthController` — simple controller, no service layer
- Unauthenticated — accessible without any token

## Response
```json
{
  "status": "ok",
  "timestamp": "2026-07-18T10:30:00.000Z"
}
```

## Important Notes
- Used by monitoring systems, load balancers, and Docker health checks.
- No database connectivity check — purely application-level health.
- Should return within milliseconds as it has no external dependencies.
