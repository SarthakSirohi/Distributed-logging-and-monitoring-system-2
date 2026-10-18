import http from "k6/http";
import { check } from "k6";


export const options = {
  stages: [
    { duration: "30s", target: 10 },
    { duration: "30s", target: 25 },
    { duration: "30s", target: 50 },
    { duration: "30s", target: 75 },
    { duration: "15s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<1000"],
  },
};

const baseUrl = __ENV.BASE_URL || "http://localhost:3001";

export default function () {
  const response = http.get(`${baseUrl}/current_time`);

  check(response, {
    "current_time responds with HTTP 200": (res) => res.status === 200,
    "response includes a current time": (res) =>
      typeof res.json("current_time") === "string",
    "response includes a request ID": (res) =>
      typeof res.json("request_id") === "string",
  });
}
