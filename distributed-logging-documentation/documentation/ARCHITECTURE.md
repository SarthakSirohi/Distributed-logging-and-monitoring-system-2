# Architecture

## Purpose
Collect structured logs from multiple service-like processes, store them centrally, and expose a query API. Request IDs make it possible to correlate activity across service-to-service calls.

## Components
- **Log Creator 1 and 2:** simulate services, call a peer endpoint, and send log records to the central server.
- **Logging server:** Express API that validates incoming logs, persists them, and serves filtered queries.
- **MongoDB:** stores log documents through Mongoose.
- **Docker Compose:** runs the components as separate containers on a shared network.
- **k6:** optionally generates traffic against the configured creator endpoint.

## Data flow
1. A request reaches a log creator.
2. The creator creates or propagates a request ID.
3. The creator submits a structured log to `POST /logs`.
4. The logging server validates the fields and level.
5. Mongoose saves the record to MongoDB.
6. A client calls `GET /logs`, optionally with filters and pagination.
7. The server returns matching documents as JSON.

## Correlation IDs
A request ID connects records associated with the same logical request, including records created by different services. Querying by `request_id` helps reconstruct the request path. Correlation IDs do not guarantee every log was successfully delivered or persisted.

## Container networking
Each Compose service has its own container and network identity. Containers should call each other using Compose service names and internal ports, not `localhost`. Multiple containers on one developer machine demonstrate service separation, but do not mean the application is running across multiple physical machines.

## Current HTTP design vs. future Kafka design
In the current design, creators send logs directly to the logging API over HTTP. This is simple to inspect, but log delivery depends on the server being reachable.

A future Kafka version could publish log events to a topic and use a consumer to persist them to MongoDB. That adds asynchronous buffering and producer/consumer decoupling, but also requires decisions about retries, consumer groups, delivery guarantees, duplicates, and dead-letter handling. Kafka is not part of the current baseline.
