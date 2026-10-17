const mongoose = require("mongoose");

const logSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true
    },
    level: {
      type: String,
      required: true,
      enum: ["DEBUG", "INFO", "WARN", "ERROR"]
    },
    machine_id: {
      type: String,
      required: true
    },
    request_id: {
      type: String,
      required: true,
      index: true
    },
    timestamp: {
      type: Date,
      required: true,
      index: true
    }
  },
  {
    collection: "logs",
    versionKey: false
  }
);

const Log = mongoose.model("Log", logSchema);

module.exports = Log;