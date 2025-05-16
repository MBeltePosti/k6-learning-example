import http from "k6/http";
import { group, sleep, check } from "k6";
import { Counter, Trend } from "k6/metrics";
import exec from "k6/execution";

export const options = {
  // Number of virtual users:
  vus: 10,
  // Duration of the test:
  duration: "5s",
  thresholds: {
    http_req_duration: ["p(95)<100"], // 95% of requests should complete below 100ms
    'group_duration{group:::Main page}': ['p(95)<100'],
    'group_duration{group:::News page}': ['p(95)<100'],
    'group_duration{group:::Main page::Assets}': ['p(95)<100'],
    http_req_failed: ["rate<0.01"], // Less than 1% of requests should fail
    checks: ["rate>=0.99"], // 99% of checks should pass
    request_counter: ["count>10"], // Custom metric: request counter should be greater than 10
    response_time_news_page: ["p(95)<150", "p(99)<200"], // Custom metric: response time for news page
  },
};

// base URL for the requests and default headers
const BASE_URL = "https://quickpizza.grafana.com";
const defaultHeaders = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate",
  Connection: "keep-alive",
  "Upgrade-Insecure-Requests": "1",
};

let requestCounter = new Counter("request_counter");
let newsResponseTimeTrend = new Trend("response_time_news_page");

export function setup() {
  // This function runs once before the test starts and is intended for setup tasks
  console.log(
    "-- setup stage --\nChecking if the application is up and running..."
  );
  let res = http.get(`${BASE_URL}/healthz`); //note, I discovered healthz path for the app myself, I assume it's the demo applications default for health check but it may not serve it's purpose - when actually creating tests, you should know exactly what endpoints do what.
  if (res.error) {
    exec.test.abort("Aborting test. Application is DOWN");
  }
}

export default function () {
  // This function runs for each virtual user and contains the main test logic
  console.log("-- VU stage --\nExecuting test...");

  group("Main page", function () {
    let res1 = http.get(`${BASE_URL}`, { headers: defaultHeaders });
    requestCounter.add(1); // Increment the request counter
    check(res1, {
      "status is 200": (r) => r.status === 200,
      "page is startpage": (r) => r.body.includes("QuickPizza"),
    });

    group("Assets", function () {
      http.get(`${BASE_URL}/_app/immutable/assets/0.56795cc5.css`, {
        headers: defaultHeaders,
      });

      http.get(`${BASE_URL}/_app/immutable/assets/1.bbbdf0b2.css`, {
        headers: defaultHeaders,
      });

      http.get(`${BASE_URL}/_app/immutable/chunks/23bb84b2.js`, {
        headers: defaultHeaders,
      });

      http.get(`${BASE_URL}/_app/immutable/entry/index.98b0eb20.js`, {
        headers: defaultHeaders,
      });

      http.get(`${BASE_URL}/_app/immutable/chunks/singletons.d45f605f.js`, {
        headers: defaultHeaders,
      });

      http.get(`${BASE_URL}/_app/immutable/chunks/index.z793c3c9.js`, {
        headers: defaultHeaders,
      });

      http.get(`${BASE_URL}/_app/immutable/chunks/app.d87d4a86.js`, {
        headers: defaultHeaders,
      });

      http.get(`${BASE_URL}/_app/immutable/chunks/public.f1ad5328.js`, {
        headers: defaultHeaders,
      });

      http.get(`${BASE_URL}/api/tools/4d01ba58d.js`, {
        headers: defaultHeaders,
      });

      http.get(`${BASE_URL}/api/tools/4.acc43fec8.js`, {
        headers: defaultHeaders,
      });

      http.get(
        `${BASE_URL}/fjnbnmpkemkfnnfnggifemleogfcfle/static/js/content.jfs`,
        {
          headers: defaultHeaders,
        }
      );

      http.get(`${BASE_URL}/images/pizza.png`, {
        headers: defaultHeaders,
      });

      http.get(`${BASE_URL}/images/eparktasks-page.jpg`, {
        headers: defaultHeaders,
      });

      http.get(
        `${BASE_URL}/lapitlmecokioimapcojcaipihabicmopma/wizard-popup.html`,
        {
          headers: defaultHeaders,
        }
      );

      http.get(
        `${BASE_URL}/kfbnbceapibloakkppcgcfpghhjen/sr/fonts/e152e7d94d3bfef/Inter-Inter-Regular.ttf`,
        {
          headers: defaultHeaders,
        }
      );

      http.get(`${BASE_URL}/api/config/config`, {
        headers: defaultHeaders,
      });
    });
  });

  group("Contacts page", function () {
    let res2 = http.get(`${BASE_URL}/contacts.php`, {
      headers: defaultHeaders,
    });
    check(res2, {
      "status is 200": (r) => r.status === 200,
      "page is contact page": (r) => r.body.includes("Contact us"),
    });
    sleep(2); // Pause for 2 seconds
  });

  group("News page", function () {
    let res3 = http.get(`${BASE_URL}/news.php`, { headers: defaultHeaders });
    newsResponseTimeTrend.add(res3.timings.duration); // Add the response time to the trend
    check(res3, {
      "status is 200": (r) => r.status === 200,
      "page is news page": (r) => r.body.includes("In the news"),
    });
    sleep(2); // Pause for 2 seconds before the next iteration
  });
}

export function teardown() {
  // This function runs once after the test ends and is intended for cleanup tasks
  console.log("-- Teardown stage --\nTest completed. Cleaning up...");
  console.log(`Total requests made: ${requestCounter.count}`);
  console.log(`Response time for news page: ${newsResponseTimeTrend}`);
}
