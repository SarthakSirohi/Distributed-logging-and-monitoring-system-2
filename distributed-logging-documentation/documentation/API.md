# API Reference

Local logging server base URL: `http://localhost:8000`.

## `GET /health`
Checks whether the Express server is responding.

Example response:

```json
{ "status": "ok" }
```

## `POST /logs`
Submits a log record for validation and persistence.

Required JSON fields:

| Field | Type | Meaning |
|---|---|---|
| `message` | string | Description of the event |
| `level` | string | `DEBUG`, `INFO`, `WARN`, or `ERROR` |
| `machine_id` | string | Identifier for the emitting service |
| `request_id` | string | Correlation/request identifier |
| `timestamp` | date/time string | Event timestamp, preferably ISO 8601 |

Example body:

```json
{
  "message": "Received current_time request",
  "level": "DEBUG",
  "machine_id": "log-creator-1",
  "request_id": "b7a1b0b2-5c93-4f20-a112-12f0c1d7f001",
  "timestamp": "2026-10-17T12:00:00.000Z"
}
```

A successfully saved record returns `201 Created`. Invalid input returns `400 Bad Request`; unexpected failures may return a server error.

## `GET /logs`
Returns stored log records. Filters can be combined.

| Parameter | Meaning |
|---|---|
| `level` | Exact log level |
| `message` | Case-insensitive literal substring match |
| `machine_id` | Emitting service/machine |
| `request_id` | Correlation ID |
| `startTime` | Start of timestamp range |
| `endTime` | End of timestamp range |
| `limit` | Integer from 1 to 500; default 100 |
| `offset` | Non-negative integer; default 0 |

Invalid dates, invalid pagination values, or a start time later than the end time return `400 Bad Request`.

Examples:

```http
GET /logs
GET /logs?level=ERROR
GET /logs?request_id=b7a1b0b2-5c93-4f20-a112-12f0c1d7f001
GET /logs?machine_id=log-creator-1&limit=50&offset=0
GET /logs?message=current_time&startTime=2026-10-17T00:00:00.000Z&endTime=2026-10-18T00:00:00.000Z
```

Example response shape:

```json
{
  "count": 1,
  "limit": 100,
  "offset": 0,
  "logs": [
    {
      "_id": "671000000000000000000001",
      "message": "Received current_time request",
      "level": "DEBUG",
      "machine_id": "log-creator-1",
      "request_id": "b7a1b0b2-5c93-4f20-a112-12f0c1d7f001",
      "timestamp": "2026-10-17T12:00:00.000Z"
    }
  ]
}
```

Example IDs and values are illustrative. Check the active branch's code if the API changes.
