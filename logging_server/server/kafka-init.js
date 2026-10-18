const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "kafka-init",
  brokers: [process.env.KAFKA_BROKER || "kafka:9092"],
});

const admin = kafka.admin();

const topics = [
  {
    topic: "logs",
    numPartitions: 3,
    replicationFactor: 1,
  },
  {
    topic: "logs.DLQ",
    numPartitions: 3,
    replicationFactor: 1,
  },
];

async function initializeKafka() {
  try {
    await admin.connect();
    console.log("Connected to Kafka");

    const created = await admin.createTopics({
      topics,
      waitForLeaders: true,
    });

    if (created) {
      console.log("Kafka topics created successfully");
    } else {
      console.log("Kafka topics already exist");
    }

    console.log("Required topics:", topics.map((t) => t.topic));
  } catch (error) {
    console.error("Kafka topic initialization failed:", error);
    process.exitCode = 1;
  } finally {
    await admin.disconnect().catch(() => {});
  }
}

initializeKafka();