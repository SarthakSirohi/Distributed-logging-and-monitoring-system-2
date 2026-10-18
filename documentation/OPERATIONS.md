# Operations and Troubleshooting

## Start

From the repository root:

```powershell
docker compose up -d --build
docker compose ps
```

Use `docker compose ps` to confirm the actual service names in your Compose file.

## Logs

```powershell
docker compose logs --tail=100 kafka
docker compose logs --tail=100 mongodb
docker compose logs --tail=100 log-consumer
docker compose logs --tail=100 logging-server
docker compose logs --tail=100 log-creator-1
docker compose logs --tail=100 log-creator-2
```

Names can differ in your Compose configuration.

## Verify topics

```powershell
docker compose exec kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server kafka:9092 --list
```

Expected: `logs` and `logs.DLQ`. If missing, inspect the Kafka topic initializer and its logs.

## End-to-end check

1. Confirm Kafka and MongoDB are running.
2. Confirm both topics exist.
3. Call a log creator endpoint using its mapped host port.
4. Inspect consumer logs for successful processing.
5. Query `GET /logs` using the logging API's mapped host port.
6. Optionally count MongoDB records:

```powershell
docker compose exec mongodb mongosh logs --quiet --eval "db.logs.countDocuments({})"
```

Ports shown in examples may differ from your `docker-compose.yml`.

## Inspect DLQ messages

```powershell
docker compose exec kafka /opt/kafka/bin/kafka-console-consumer.sh --bootstrap-server kafka:9092 --topic logs.DLQ --from-beginning
```

To test malformed JSON in development:

```powershell
docker compose exec kafka /opt/kafka/bin/kafka-console-producer.sh --bootstrap-server kafka:9092 --topic logs
```

Enter `{invalid-json`, then press `Ctrl+C`. Inspect consumer logs and the DLQ topic.

## Troubleshooting

### No MongoDB record appears
- Check log creator logs for Kafka send errors.
- Confirm producer broker address: containers commonly use `kafka:9092`; host processes use the host-mapped address.
- Confirm consumer subscription to `logs`.
- Inspect consumer logs for validation, DLQ, or MongoDB errors.
- An HTTP success response may not guarantee Kafka publication if the producer error is caught without failing the request.

### Kafka connection fails
- Check Kafka startup logs and container health.
- Use the correct broker address for the process's network.
- Ensure topic initialization runs after Kafka is ready.

### MongoDB connection fails
- Confirm MongoDB is running.
- Inside Compose, use the service hostname and container port, commonly `mongodb:27017`.
- Check `MONGODB_URI` / `MONGO_URI` environment values.

### Tests fail
Run `npm test` from the repository root. Ensure dependencies are installed and tests use a dedicated test database rather than important local data.

## Stop

```powershell
docker compose down
```

Use `docker compose down -v` only when you intend to delete Compose-managed volumes and local persisted data.
