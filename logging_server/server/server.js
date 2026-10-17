require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const Log = require("./models/Log");

const app = express();
const PORT = process.env.PORT || 8000;

const MONGODB_URI =
  process.env.MONGODB_URI || process.env.MONGO_URI;

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Receive and store logs
app.post("/logs", async (req, res) => {
  try {
    const {
      message,
      level,
      machine_id,
      request_id,
      timestamp,
    } = req.body;

    // Validate required fields
    if (
      !message ||
      !level ||
      !machine_id ||
      !request_id ||
      !timestamp
    ) {
      return res.status(400).json({
        error:
          "message, level, machine_id, request_id, and timestamp are required",
      });
    }

    // Validate log level before saving to MongoDB
    const validLevels = ["DEBUG", "INFO", "WARN", "ERROR"];

    if (!validLevels.includes(level)) {
      return res.status(400).json({
        error: "Invalid log level",
      });
    }

    // Save log to MongoDB
    const log = await Log.create({
      message,
      level,
      machine_id,
      request_id,
      timestamp,
    });

    return res.status(201).json({
      message: "Log saved successfully",
      log,
    });
  } catch (error) {
    console.error("Failed to save log:", error.message);

    return res.status(500).json({
      error: "Failed to save log",
    });
  }
});

// Retrieve, filter, search, and paginate logs
app.get("/logs", async (req, res) => {
  try {
    const {
      level,
      message,
      machine_id,
      request_id,
      startTime,
      endTime,
    } = req.query;

    // Build the MongoDB filter
    const filter = {};

    if (level) {
      filter.level = level;
    }

    if (message) {
      // Treat the search text literally and ignore case.
      const safeMessage = message.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      filter.message = {
        $regex: safeMessage,
        $options: "i",
      };
    }

    if (machine_id) {
      filter.machine_id = machine_id;
    }

    if (request_id) {
      filter.request_id = request_id;
    }

    // Filter by timestamp range
    if (startTime || endTime) {
      const startDate = startTime
        ? new Date(startTime)
        : null;

      const endDate = endTime
        ? new Date(endTime)
        : null;

      if (
        (startDate &&
          Number.isNaN(startDate.getTime())) ||
        (endDate &&
          Number.isNaN(endDate.getTime()))
      ) {
        return res.status(400).json({
          error: "Invalid startTime or endTime",
        });
      }

      if (
        startDate &&
        endDate &&
        startDate > endDate
      ) {
        return res.status(400).json({
          error:
            "startTime must be before or equal to endTime",
        });
      }

      filter.timestamp = {};

      if (startDate) {
        filter.timestamp.$gte = startDate;
      }

      if (endDate) {
        filter.timestamp.$lte = endDate;
      }
    }

    // Pagination
    const rawLimit = req.query.limit;
    const rawOffset = req.query.offset;

    // Apply defaults only when parameters are omitted
    const requestedLimit =
      rawLimit === undefined ? 100 : Number(rawLimit);

    const requestedOffset =
      rawOffset === undefined ? 0 : Number(rawOffset);

    // Validate limit
    if (
      !Number.isInteger(requestedLimit) ||
      requestedLimit < 1 ||
      requestedLimit > 500
    ) {
      return res.status(400).json({
        error: "limit must be an integer between 1 and 500",
      });
    }

    // Validate offset
    if (
      !Number.isInteger(requestedOffset) ||
      requestedOffset < 0
    ) {
      return res.status(400).json({
        error: "offset must be a non-negative integer",
      });
    }

    const limit = requestedLimit;
    const offset = requestedOffset;

    // Fetch the page and total matching count concurrently
    const [logs, count] = await Promise.all([
      Log.find(filter)
        .sort({ timestamp: -1 })
        .skip(offset)
        .limit(limit),

      Log.countDocuments(filter),
    ]);

    return res.json({
      count,
      limit,
      offset,
      logs,
    });
  } catch (error) {
    console.error("Failed to fetch logs:", error.message);

    return res.status(500).json({
      error: "Failed to fetch logs",
    });
  }
});

// Connect to MongoDB, then start the server
async function startServer() {
  try {
    if (!MONGODB_URI) {
      throw new Error(
        "Missing MONGODB_URI or MONGO_URI in .env"
      );
    }

    await mongoose.connect(MONGODB_URI);

    console.log("Connected to MongoDB");

    app.listen(PORT, () => {
      console.log(
        `Central Logging Server is running on port ${PORT}`
      );
    });
  } catch (error) {
    console.error(
      "Failed to start logging server:",
      error.message
    );

    process.exitCode = 1;
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;