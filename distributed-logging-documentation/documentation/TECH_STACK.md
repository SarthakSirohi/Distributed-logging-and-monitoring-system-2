# Technology Stack

| Technology | Role |
|---|---|
| Node.js | JavaScript runtime for the creators and API |
| Express | HTTP endpoints and request handling |
| Axios | HTTP requests between services and to the logging API |
| MongoDB | Persistent document storage |
| Mongoose | Log schema and database access |
| Docker | Container runtime |
| Docker Compose | Local multi-service orchestration |
| Mocha | Automated test runner |
| k6 | HTTP load generation and performance measurements |

## Why MongoDB?
This implementation uses MongoDB/Mongoose instead of the PostgreSQL/Prisma stack used by the reference project. Documents provide a straightforward way to store structured log events, while Mongoose provides schema validation and model-based access. This is a learning choice, not a claim that MongoDB is always the best database for logging; production choices depend on ingestion rate, query patterns, retention, indexing, durability, and operations.

## Why Docker Compose?
Compose starts the database and application services together and gives them a shared network. Service-to-service traffic should use Compose service names, not container-local `localhost`.

## Why k6?
k6 creates repeatable HTTP traffic and reports latency and failures. The current scenario targets the configured creator endpoint; additional checks would be needed to validate end-to-end log persistence.
