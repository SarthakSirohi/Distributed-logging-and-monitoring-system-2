require("dotenv").config();

const express = require("express");
const axios = require("axios");
const { randomUUID } = require("crypto");
const { Kafka } = require("kafkajs");

const app = express();

const PORT = Number(process.env.PORT) || 3001;
const SERVICE_NAME = process.env.SERVICE_NAME || `log_creator_${PORT}`;
const PEER_URL = process.env.PEER_URL;

const kafka = new Kafka({
  clientId: SERVICE_NAME,
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
});

const producer = kafka.producer({
  idempotent: true,
});

async function writeLog(message, level, requestId) {
  const log = {
    message,
    level,
    machine_id: SERVICE_NAME,
    request_id: requestId,
    timestamp: new Date().toISOString(),
  };

  console.log(JSON.stringify(log));

  try {
    // Wait until Kafka acknowledges the message.
    await producer.send({
      topic: "logs",
      acks: -1,
      messages: [
        {
          key: requestId,
          value: JSON.stringify(log),
        },
      ],
    });

    console.log("Kafka acknowledged log:", requestId);

    return true;
  } catch (err) {
    console.error("Failed to publish log to Kafka:", err.message);

    return false;
  }
}

app.get("/current_time", async (req, res) => {
  const requestId = req.headers["x-request-id"] || randomUUID();
  const currentTime = new Date().toISOString();

  const logged = await writeLog(
    "Received current_time request",
    "DEBUG",
    requestId
  );

  res.json({
    current_time: currentTime,
    request_id: requestId,
    service: SERVICE_NAME,
    log_published: logged,
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: SERVICE_NAME,
  });
});

async function callPeer() {
  if (!PEER_URL) return;

  const requestId = randomUUID();

  try {
    const response = await axios.get(`${PEER_URL}/current_time`, {
      headers: {
        "x-request-id": requestId,
      },
      timeout: 5000,
    });

    await writeLog(
      `Peer responded with time ${response.data.current_time}`,
      "INFO",
      requestId
    );
  } catch (err) {
    await writeLog(
      `Peer request failed: ${err.message}`,
      "ERROR",
      requestId
    );
  }
}

async function startServer() {
  try {
    await producer.connect();
    console.log("Kafka producer connected");

    app.listen(PORT, () => {
      console.log(`${SERVICE_NAME} listening on port ${PORT}`);
      callPeer();
      setInterval(callPeer, 10000);
    });
  } catch (error) {
    console.error("Failed to start:", error.message);
    process.exitCode = 1;
  }
}

startServer();

module.exports = app;