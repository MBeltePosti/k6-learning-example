import http from 'k6/http';
import { sleep } from 'k6';
import { check } from 'k6';
import { Counter, Trend } from 'k6/metrics';

export const options = {
  // Number of virtual users:
  vus: 10,
  // Duration of the test:
  duration: '5s',
  thresholds: {
    http_req_duration: ['p(95)<100'], // 95% of requests should complete below 100ms
    http_req_failed: ['rate<0.01'], // Less than 1% of requests should fail
    checks: ['rate>=0.99'], // 99% of checks should pass
    request_counter: ['count>10'], // Custom metric: request counter should be greater than 10
    response_time_news_page: ['p(95)<150', 'p(99)<200'], // Custom metric: response time for news page
  },
};

// base URL for the requests and default headers
const BASE_URL = 'https://quickpizza.grafana.com';
const defaultHeaders = {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
};

let requestCounter = new Counter('request_counter');
let newsResponseTimeTrend = new Trend('response_time_news_page');

export default function () {
    let res1 = http.get(`${BASE_URL}`, { headers: defaultHeaders });
    requestCounter.add(1); // Increment the request counter
    check(res1, {
       'status is 200': (r) => r.status === 200,
       'page is startpage': (r) => r.body.includes('QuickPizza'), 
      });
    sleep(1); // Pause for 1 second

    let res2 = http.get(`${BASE_URL}/contacts.php`, { headers: defaultHeaders });
    check(res2, { 
      'status is 200': (r) => r.status === 200,
      'page is contact page': (r) => r.body.includes('Contact us') 
    });
    sleep(2); // Pause for 2 seconds

    let res3 = http.get(`${BASE_URL}/news.php`, { headers: defaultHeaders });
    newsResponseTimeTrend.add(res3.timings.duration); // Add the response time to the trend
    check(res3, { 
      'status is 200': (r) => r.status === 200, 
      'page is news page': (r) => r.body.includes('In the news') 
    });
    sleep(2); // Pause for 2 seconds before the next iteration
}