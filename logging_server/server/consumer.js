require("dotenv").config();

const mongoose = require("mongoose");
const { Kafka } = require("kafkajs");
const Log = require("./models/Log");

// Configuration
const MONGODB_URI =
  process.env.MONGODB_URI || process.env.MONGO_URI;

const KAFKA_BROKER =
  process.env.KAFKA_BROKER || "localhost:9092";

const KAFKA_TOPIC = process.env.KAFKA_TOPIC || "logs";
const DLQ_TOPIC = process.env.DLQ_TOPIC || "logs.DLQ";

const KAFKA_GROUP_ID =
  process.env.KAFKA_GROUP_ID ||
  "logging-system-consumer-group";

const VALID_LEVELS = ["DEBUG", "INFO", "WARN", "ERROR"];

// Kafka client
const kafka = new Kafka({
  clientId: "logging-system-consumer",
  brokers: [KAFKA_BROKER],
});

// Consumer reads messages from the main topic
const consumer = kafka.consumer({
  groupId: KAFKA_GROUP_ID,
});

// Producer sends failed messages to the DLQ topic
const dlqProducer = kafka.producer();

// Gracefully disconnect services
async function shutdown() {
  console.log("Shutting down Kafka consumer...");

  try {
    await consumer.disconnect();
  } catch (error) {
    console.error("Error disconnecting consumer:", error.message);
  }

  try {
    await dlqProducer.disconnect();
  } catch (error) {
    console.error("Error disconnecting DLQ producer:", error.message);
  }

  try {
    await mongoose.disconnect();
  } catch (error) {
    console.error("Error disconnecting MongoDB:", error.message);
  }
}

// Send a failed message to the dead letter topic
async function sendToDLQ({
  originalMessage,
  error,
  topic,
  partition,
  offset,
}) {
  const dlqRecord = {
    originalMessage,
    error,
    sourceTopic: topic,
    sourcePartition: partition,
    sourceOffset: offset,
    failedAt: new Date().toISOString(),
  };

  await dlqProducer.send({
    topic: DLQ_TOPIC,
    acks: -1,
    messages: [
      {
        key: `${topic}-${partition}-${offset}`,
        value: JSON.stringify(dlqRecord),
      },
    ],
  });

  console.log("Message sent to DLQ:", {
    sourceTopic: topic,
    partition,
    offset,
    error,
  });
}

// Start the Kafka consumer
async function startConsumer() {
  if (!MONGODB_URI) {
    throw new Error("Missing MONGODB_URI or MONGO_URI");
  }

  // Connect to MongoDB
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  // Connect the consumer and DLQ producer
  await consumer.connect();
  console.log("Connected to Kafka consumer");

  await dlqProducer.connect();
  console.log("Connected to DLQ producer");

  // Subscribe to the main logs topic
  await consumer.subscribe({
    topic: KAFKA_TOPIC,
    fromBeginning: true,
  });

  console.log(`Listening to Kafka topic: ${KAFKA_TOPIC}`);

  // KafkaJS calls eachMessage for each consumed message
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const originalMessage = message.value
        ? message.value.toString()
        : null;

      // 1. Handle empty messages
      if (originalMessage === null) {
        await sendToDLQ({
          originalMessage: null,
          error: "Empty Kafka message",
          topic,
          partition,
          offset: message.offset,
        });

        return;
      }

      // 2. Parse JSON
      let log;

      try {
        log = JSON.parse(originalMessage);
      } catch {
        await sendToDLQ({
          originalMessage,
          error: "Invalid JSON",
          topic,
          partition,
          offset: message.offset,
        });

        return;
      }

      // 3. Validate the log
      const isValid =
        log !== null &&
        typeof log === "object" &&
        !Array.isArray(log) &&
        typeof log.message === "string" &&
        log.message.trim().length > 0 &&
        VALID_LEVELS.includes(log.level) &&
        typeof log.machine_id === "string" &&
        log.machine_id.trim().length > 0 &&
        typeof log.request_id === "string" &&
        log.request_id.trim().length > 0 &&
        log.timestamp &&
        !Number.isNaN(new Date(log.timestamp).getTime());

      if (!isValid) {
        await sendToDLQ({
          originalMessage,
          error: "Invalid log fields",
          topic,
          partition,
          offset: message.offset,
        });

        return;
      }

      // 4. Save valid logs to MongoDB
      // If this fails, throw the error so the failure isn't
      // silently treated as a successfully processed message.
      await Log.create({
        message: log.message,
        level: log.level,
        machine_id: log.machine_id,
        request_id: log.request_id,
        timestamp: new Date(log.timestamp),
      });

      console.log("Log saved to MongoDB:", log.request_id);
    },
  });
}

// Register shutdown handlers only when executed directly
if (require.main === module) {
  process.once("SIGINT", async () => {
    await shutdown();
    process.exit(0);
  });

  process.once("SIGTERM", async () => {
    await shutdown();
    process.exit(0);
  });

  startConsumer().catch(async (error) => {
    console.error("Failed to start Kafka consumer:", error);
    await shutdown();
    process.exitCode = 1;
  });
}

module.exports = {
  sendToDLQ,
};