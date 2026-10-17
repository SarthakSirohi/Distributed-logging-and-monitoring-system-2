# Load testing

Run the load test from the project root with:

```sh
npm run loadtest
```

This runs k6 in Docker, starts the application services if needed, and targets
the `log-creator-1` `/current_time` endpoint from inside the Compose network.
Docker Desktop must be running. The test uses 10 virtual users for 30 seconds
and fails if more than 1% of requests fail or the 95th-percentile response time
reaches one second.

To use a local k6 installation instead, start the services with
`docker compose up -d` and run:

```sh
k6 run k6/load-test.js
```

The local run targets `http://localhost:3001` by default. Set `BASE_URL` to
change the endpoint.
