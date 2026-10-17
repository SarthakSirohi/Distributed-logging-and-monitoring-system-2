# Distributed Logging and Monitoring System

A backend-focused project that simulates multiple services generating logs, correlates requests across services, and sends structured log records to a central API for storage in MongoDB.

## Features
- Two log-creator services that call one another over HTTP.
- Request IDs to correlate related activity across services.
- Central Express API for log ingestion and retrieval.
- MongoDB persistence through Mongoose.
- Filtering and pagination for log queries.
- Docker Compose for running the full stack.
- Mocha tests and an optional k6 load-test profile.

## Tech stack
Node.js, Express, Axios, MongoDB, Mongoose, Docker, Docker Compose, Mocha, and k6.

## Run the project

Run these commands from the repository root, where `docker-compose.yml` is located:

```powershell
docker compose up --build -d
docker compose ps
```

Compose builds and starts the services configured in the Compose file; you do not need to start each container's Node process manually.

### Local endpoints
- Creator 1: http://localhost:3001/current_time
- Creator 2: http://localhost:3002/current_time
- Logging server health: http://localhost:8000/health
- Stored logs: http://localhost:8000/logs

View logs:

```powershell
docker compose logs -f log-creator-1 log-creator-2
docker compose logs -f logging-server
```

Run tests:

```powershell
npm test
```

Run the optional k6 profile if the root `package.json` includes the configured script:

```powershell
npm run load:test
```

Or invoke Compose directly:

```powershell
docker compose --profile loadtest run --rm k6
```

Stop the stack:

```powershell
docker compose down
```

Normal `docker compose down` preserves named volumes unless you explicitly remove them with `-v`.

## Documentation
- [Architecture](documentation/ARCHITECTURE.md)
- [API reference](documentation/API.md)
- [Setup and testing](documentation/SETUP_AND_TESTING.md)
- [Technology stack](documentation/TECH_STACK.md)
- [Roadmap](documentation/ROADMAP.md)

## Configuration notes
For a Node process running on your host, a MongoDB URI such as `mongodb://localhost:27017/logs` is appropriate if MongoDB's port is published. Inside Docker Compose, use the MongoDB service name, for example `mongodb://mongodb:27017/logs` when the service is named `mongodb`; inside a container, `localhost` refers to that same container.

## Current scope and limitations
This version uses direct HTTP log delivery and MongoDB. It does not yet use Kafka, and the frontend from the reference repository has intentionally been omitted. The current k6 scenario exercises the configured creator endpoint; it does not by itself verify that every request resulted in a persisted MongoDB record.

## Planned evolution
Keep this HTTP + MongoDB baseline on `main`, then build a Kafka-based asynchronous version on a separate branch such as `kafka-upgrade`. This allows both implementations to remain available for comparison.


