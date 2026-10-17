# Development Roadmap

The project is being built incrementally so each new concept can be compared with a working baseline.

## Stage 1 — HTTP + MongoDB baseline
- [x] Two service-like log creators
- [x] Service-to-service requests and request ID correlation
- [x] Central Express log ingestion API
- [x] MongoDB/Mongoose persistence
- [x] Query filters and pagination
- [x] Docker Compose stack
- [x] Automated tests
- [x] Optional k6 load-test setup

## Stage 2 — Reliability improvements
- [ ] Define behavior when the logging API is unavailable
- [ ] Add bounded retry/backoff where appropriate
- [ ] Make failed log delivery visible
- [ ] Add graceful shutdown and clearer operational logs
- [ ] Test end-to-end persistence under load
- [ ] Review database indexes against query patterns

## Stage 3 — Kafka branch
Keep the HTTP version on `main`; implement the event-driven version on a separate branch such as `kafka-upgrade`.

- [ ] Introduce a Kafka-compatible broker and topic strategy
- [ ] Publish log events from creators
- [ ] Consume events and persist them to MongoDB
- [ ] Define consumer groups and partitioning
- [ ] Handle retries and poison messages/dead-letter behavior
- [ ] Consider duplicate delivery and idempotent writes
- [ ] Compare HTTP and Kafka versions with equivalent load tests

## Stage 4 — Observability
- [ ] Add metrics for accepted/rejected logs, latency, and database failures
- [ ] Improve health/readiness checks
- [ ] Define log retention and cleanup
- [ ] Document capacity limits and failure scenarios

Unchecked items are future plans, not features claimed by the current implementation.
