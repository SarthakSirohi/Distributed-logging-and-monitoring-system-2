# Documentation

Use the [root README](../README.md) for setup and a quick start.

- [Architecture](ARCHITECTURE.md): components, message flow, correlation IDs, and reliability trade-offs.
- [API Reference](API.md): health and log-query endpoints.
- [Operations](OPERATIONS.md): startup, verification, DLQ inspection, and troubleshooting.

## Data path

```text
Log creators -> Kafka topic `logs` -> Kafka consumer -> MongoDB
                                  \-> invalid messages -> `logs.DLQ`

API client -> Express logging API -> MongoDB queries
```
