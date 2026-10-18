const { expect } = require("chai");
const request = require("supertest");
const mongoose = require("mongoose");

// Always use a separate test database.
// You can override this with MONGODB_TEST_URI.
const testMongoUri =
  process.env.MONGODB_TEST_URI ||
  "mongodb://127.0.0.1:27017/logging_system_test";

process.env.MONGODB_URI = testMongoUri;
process.env.MONGO_URI = testMongoUri;

const app = require("../server");
const Log = require("../models/Log");

// Known data used by our tests
const testLogs = [
  {
    message: "Database connection failed",
    level: "ERROR",
    machine_id: "machine-1",
    request_id: "request-1",
    timestamp: new Date("2026-10-15T10:00:00.000Z")
  },
  {
    message: "Database connection restored",
    level: "INFO",
    machine_id: "machine-1",
    request_id: "request-2",
    timestamp: new Date("2026-10-15T11:00:00.000Z")
  },
  {
    message: "Request processed successfully",
    level: "INFO",
    machine_id: "machine-2",
    request_id: "request-3",
    timestamp: new Date("2026-10-16T10:00:00.000Z")
  },
  {
    message: "Service unavailable",
    level: "WARN",
    machine_id: "machine-2",
    request_id: "request-4",
    timestamp: new Date("2026-10-17T10:00:00.000Z")
  }
];

async function seedLogs() {
  await Log.insertMany(testLogs);
}

describe("Logging API", function () {
  // Connect to the dedicated test database.
  before(async function () {
    await mongoose.connect(testMongoUri);
  });

  // Start every test with an empty logs collection.
  beforeEach(async function () {
    await Log.deleteMany({});
  });

  // Clean up after each test.
  afterEach(async function () {
    await Log.deleteMany({});
  });

  // Disconnect after the entire suite.
  after(async function () {
    await mongoose.disconnect();
  });

  // --------------------------------------------------
  // 1. HEALTH CHECK
  // --------------------------------------------------

  describe("GET /health", function () {
    it("should return HTTP 200", async function () {
      const response = await request(app).get("/health");

      expect(response.status).to.equal(200);
    });

    it("should return the expected health response", async function () {
      const response = await request(app).get("/health");

      expect(response.body).to.deep.equal({
        status: "ok"
      });
    });
  });


  // --------------------------------------------------
  // 3. RETRIEVE LOGS
  // --------------------------------------------------

  describe("GET /logs", function () {
    it("should return an array of logs and pagination metadata", async function () {
      await seedLogs();

      const response = await request(app).get("/logs");

      expect(response.status).to.equal(200);
      expect(response.body.logs).to.be.an("array");
      expect(response.body).to.have.property("count");
      expect(response.body).to.have.property("limit");
      expect(response.body).to.have.property("offset");
    });

    it("should return all seeded logs when the limit is sufficient", async function () {
      await seedLogs();

      const response = await request(app)
        .get("/logs?limit=10");

      expect(response.status).to.equal(200);
      expect(response.body.logs).to.have.lengthOf(4);
    });

    it("should return an empty array when no logs match", async function () {
      await seedLogs();

      const response = await request(app)
        .get("/logs?message=message-that-does-not-exist");

      expect(response.status).to.equal(200);
      expect(response.body.logs).to.be.an("array").that.is.empty;
    });
  });

  // --------------------------------------------------
  // 4. FILTER BY LEVEL
  // --------------------------------------------------

  describe("GET /logs - level filter", function () {
    it("should return only logs with the requested level", async function () {
      await seedLogs();

      const response = await request(app)
        .get("/logs?level=ERROR");

      expect(response.status).to.equal(200);
      expect(response.body.logs).to.have.lengthOf(1);
      expect(
        response.body.logs.every((log) => log.level === "ERROR")
      ).to.equal(true);
    });

    it("should return no logs when the level has no matches", async function () {
      await seedLogs();

      const response = await request(app)
        .get("/logs?level=DEBUG");

      expect(response.status).to.equal(200);
      expect(response.body.logs).to.be.empty;
    });
  });

  // --------------------------------------------------
  // 5. FILTER BY MESSAGE
  // --------------------------------------------------

  describe("GET /logs - message filter", function () {
    it("should find messages containing the search term", async function () {
      await seedLogs();

      const response = await request(app)
        .get("/logs")
        .query({ message: "Database" });

      expect(response.status).to.equal(200);
      expect(response.body.logs).to.have.lengthOf(2);

      expect(
        response.body.logs.every((log) =>
          log.message.toLowerCase().includes("database")
        )
      ).to.equal(true);
    });

    it("should perform case-insensitive message searches", async function () {
      await seedLogs();

      const response = await request(app)
        .get("/logs")
        .query({ message: "dAtAbAsE" });

      expect(response.status).to.equal(200);
      expect(response.body.logs).to.have.lengthOf(2);
    });
  });

  // --------------------------------------------------
  // 6. FILTER BY MACHINE ID
  // --------------------------------------------------

  describe("GET /logs - machine_id filter", function () {
    it("should return only logs from the requested machine", async function () {
      await seedLogs();

      const response = await request(app)
        .get("/logs?machine_id=machine-1");

      expect(response.status).to.equal(200);
      expect(response.body.logs).to.have.lengthOf(2);

      expect(
        response.body.logs.every(
          (log) => log.machine_id === "machine-1"
        )
      ).to.equal(true);
    });
  });

  // --------------------------------------------------
  // 7. FILTER BY REQUEST ID
  // --------------------------------------------------

  describe("GET /logs - request_id filter", function () {
    it("should return only logs for the requested request ID", async function () {
      await seedLogs();

      const response = await request(app)
        .get("/logs?request_id=request-3");

      expect(response.status).to.equal(200);
      expect(response.body.logs).to.have.lengthOf(1);
      expect(response.body.logs[0].request_id).to.equal(
        "request-3"
      );
    });
  });

  // --------------------------------------------------
  // 8. FILTER BY TIME RANGE
  // --------------------------------------------------

  describe("GET /logs - time range", function () {
    it("should return logs inside the requested time range", async function () {
      await seedLogs();

      const response = await request(app)
        .get("/logs")
        .query({
          startTime: "2026-10-15T00:00:00.000Z",
          endTime: "2026-10-16T00:00:00.000Z"
        });

      expect(response.status).to.equal(200);
      expect(response.body.logs).to.have.lengthOf(2);

      for (const log of response.body.logs) {
        const timestamp = new Date(log.timestamp).getTime();

        expect(timestamp).to.be.at.least(
          Date.parse("2026-10-15T00:00:00.000Z")
        );

        expect(timestamp).to.be.at.most(
          Date.parse("2026-10-16T00:00:00.000Z")
        );
      }
    });

    it("should reject an invalid startTime", async function () {
      const response = await request(app)
        .get("/logs?startTime=invalid-date");

      expect(response.status).to.equal(400);
      expect(response.body).to.have.property("error");
    });

    it("should reject an invalid endTime", async function () {
      const response = await request(app)
        .get("/logs?endTime=invalid-date");

      expect(response.status).to.equal(400);
      expect(response.body).to.have.property("error");
    });

    it("should reject startTime later than endTime", async function () {
      const response = await request(app)
        .get("/logs")
        .query({
          startTime: "2026-10-16T00:00:00.000Z",
          endTime: "2026-10-15T00:00:00.000Z"
        });

      expect(response.status).to.equal(400);
      expect(response.body).to.have.property("error");
    });
  });

  // --------------------------------------------------
  // 9. PAGINATION
  // --------------------------------------------------

  describe("GET /logs - pagination", function () {
    it("should respect the requested limit", async function () {
      await seedLogs();

      const response = await request(app)
        .get("/logs?limit=2&offset=0");

      expect(response.status).to.equal(200);
      expect(response.body.limit).to.equal(2);
      expect(response.body.offset).to.equal(0);
      expect(response.body.logs).to.have.lengthOf(2);
    });

    it("should respect the requested offset", async function () {
      await seedLogs();

      const response = await request(app)
        .get("/logs?limit=2&offset=2");

      expect(response.status).to.equal(200);
      expect(response.body.limit).to.equal(2);
      expect(response.body.offset).to.equal(2);
      expect(response.body.logs).to.have.lengthOf(2);
    });

    it("should return no logs when the offset is beyond the results", async function () {
      await seedLogs();

      const response = await request(app)
        .get("/logs?limit=2&offset=100");

      expect(response.status).to.equal(200);
      expect(response.body.logs).to.be.empty;
    });

    it("should reject a non-numeric limit", async function () {
      const response = await request(app)
        .get("/logs?limit=abc");

      expect(response.status).to.equal(400);
    });

    it("should reject a zero limit", async function () {
      const response = await request(app)
        .get("/logs?limit=0");

      expect(response.status).to.equal(400);
    });

    it("should reject a limit above the maximum of 500", async function () {
      const response = await request(app)
        .get("/logs?limit=501");

      expect(response.status).to.equal(400);
    });

    it("should reject a negative offset", async function () {
      const response = await request(app)
        .get("/logs?offset=-1");

      expect(response.status).to.equal(400);
    });

    it("should reject a non-numeric offset", async function () {
      const response = await request(app)
        .get("/logs?offset=abc");

      expect(response.status).to.equal(400);
    });
  });

  // --------------------------------------------------
  // 10. COMBINED FILTERS
  // --------------------------------------------------

  describe("GET /logs - combined filters", function () {
    it("should apply multiple filters together", async function () {
      await seedLogs();

      const response = await request(app)
        .get("/logs")
        .query({
          level: "INFO",
          machine_id: "machine-1",
          startTime: "2026-10-15T00:00:00.000Z",
          endTime: "2026-10-16T00:00:00.000Z",
          limit: 10,
          offset: 0
        });

      expect(response.status).to.equal(200);
      expect(response.body.logs).to.have.lengthOf(1);

      const log = response.body.logs[0];

      expect(log.level).to.equal("INFO");
      expect(log.machine_id).to.equal("machine-1");
      expect(log.message).to.equal(
        "Database connection restored"
      );
    });
  });
});