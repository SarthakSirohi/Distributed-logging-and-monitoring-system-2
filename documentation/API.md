# API Reference

The Express API is used for health checks and retrieving records from MongoDB. In this architecture, log creators publish to Kafka rather than using the Express API as the primary ingestion path.

> The exact query parameter names, defaults, response format, and status codes must match `logging_server/server/server.js`. That file is authoritative.

## Base URL

Use the host port mapped to `logging-server` in `docker-compose.yml`. The examples below assume `http://localhost:3000`; change the port if your Compose file differs.

## `GET /health`

```powershell
Invoke-RestMethod http://localhost:3000/health
```

This checks that the API responds. It does not alone prove Kafka consumption or MongoDB writes are healthy.

## `GET /logs`

```powershell
Invoke-RestMethod http://localhost:3000/logs
```

The implementation supports log retrieval with filters such as level, machine ID, message search, date range, and pagination. Confirm the exact query parameter names and accepted formats in `server.js`.

Example, if `level` and `limit` are supported:

```powershell
Invoke-RestMethod "http://localhost:3000/logs?level=ERROR&limit=20"
```

## Log fields

| Field | Meaning |
|---|---|
| `message` | Description of the event |
| `level` | `DEBUG`, `INFO`, `WARN`, or `ERROR` |
| `machine_id` | Service or machine identifier |
| `request_id` | Correlation identifier for related events |
| `timestamp` | Event timestamp |

MongoDB may also expose `_id`. The Mongoose schema defines the actual stored shape.

## Error handling

Exact status codes and error response bodies depend on the route implementation. Check validation and error handling in `server.js`.

## Kafka ingestion

The Kafka consumer reads from `logs`, validates records, writes valid records to MongoDB, and sends invalid records to `logs.DLQ`. `GET /logs` retrieves persisted records; a Kafka record may not be visible until the consumer has processed it.
