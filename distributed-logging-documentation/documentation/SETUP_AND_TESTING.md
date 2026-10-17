# Setup and Testing

## Prerequisites
- Docker Desktop with Docker Compose
- Node.js/npm for running tests from the host
- Git

## Start the stack
From the repository root:

```powershell
docker compose up --build -d
docker compose ps
```

This starts the services configured in Compose. The k6 service is under an optional profile and is not started by default.

## Verify
Open:
- `http://localhost:3001/current_time`
- `http://localhost:3002/current_time`
- `http://localhost:8000/health`
- `http://localhost:8000/logs`

Call the creator endpoints, then refresh `/logs` to inspect records stored by the logging server.

## Inspect service output

```powershell
docker compose logs -f log-creator-1 log-creator-2
docker compose logs -f logging-server
```

The logging server may print only startup output unless request-level console logging is implemented. Use `GET /logs` to inspect saved records.

## Run tests

```powershell
npm test
```

This runs the Mocha test command configured in the root `package.json`.

## Optional load test

If configured in the root package:

```powershell
npm run load:test
```

Or run the Compose profile directly:

```powershell
docker compose --profile loadtest run --rm k6
```

Review the k6 script and environment before interpreting results. A successful response from `/current_time` does not prove that every associated log reached MongoDB.

## Stop the stack

```powershell
docker compose down
```

This normally preserves named volumes. Avoid `docker compose down -v` unless you intend to delete persisted database data.

## Troubleshooting
- **MongoDB connection fails:** use `mongodb://mongodb:27017/logs` inside Compose when the service is named `mongodb`; use `localhost` only from the host environment when the port is published.
- **Creator cannot reach peer:** use the peer's Compose service name and internal port inside containers.
- **Endpoint unavailable:** check `docker compose ps`, service logs, published ports, HTTP method, and path.
- **No logs appear:** inspect creator delivery errors, logging server output, and the configured MongoDB URI.
