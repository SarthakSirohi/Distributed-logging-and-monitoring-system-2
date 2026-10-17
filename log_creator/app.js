require("dotenv").config();
const express = require("express");
const axios = require("axios");
const { randomUUID } = require("crypto");

const app = express();

const PORT = Number(process.env.PORT) || 3001;
const SERVICE_NAME = process.env.SERVICE_NAME || `log_creator_${PORT}`;
const PEER_URL = process.env.PEER_URL;
const LOG_SERVER_URL = process.env.LOG_SERVER_URL || "http://localhost:8000";


function writeLog(message, level, requestId) {
  const log = {
    message,
    level,
    machine_id: SERVICE_NAME,
    request_id: requestId,
    timestamp: new Date().toISOString()
  };

  console.log(JSON.stringify(log));

  // Send the same log to the central logging server.
  axios
    .post(`${LOG_SERVER_URL}/logs`, log, {
      timeout: 5000
    })
    .catch((error) => {
      console.error(
        "Failed to send log to central server:",
        error.message
      );
    });
}

app.get("/current_time", (req, res) => {
  const requestId =
    req.get("x-request-id") || randomUUID();

  const currentTime = new Date().toISOString();

  writeLog(
    "Received current_time request",
    "DEBUG",
    requestId
  );

  res.json({
    current_time: currentTime,
    request_id: requestId,
    service: SERVICE_NAME
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: SERVICE_NAME
  });
});

async function callPeer() {
  if (!PEER_URL) {
    return;
  }

  const requestId = randomUUID();

  try {
    writeLog(
      "Calling peer service",
      "INFO",
      requestId
    );

    const response = await axios.get(
      `${PEER_URL}/current_time`,
      {
        headers: {
          "x-request-id": requestId
        },
        timeout: 5000
      }
    );

    writeLog(
      `Peer responded with time ${response.data.current_time}`,
      "INFO",
      requestId
    );
  } catch (error) {
    writeLog(
      `Peer request failed: ${error.message}`,
      "ERROR",
      requestId
    );
  }
}

app.listen(PORT, () => {
  console.log(
    `${SERVICE_NAME} listening on port ${PORT}`
  );

  callPeer();
  setInterval(callPeer, 10000);
});