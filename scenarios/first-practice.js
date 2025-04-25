import http from 'k6/http';
import { sleep } from 'k6';
import { check } from 'k6';

export const options = {
  // Number of virtual users:
  vus: 55,
  // Duration of the test:
  duration: '54s',
};

// base URL for the requests and default headers
const BASE_URL = 'https://test.k6.io';
const defaultHeaders = {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
};

export default function () {
    let res1 = http.get(`${BASE_URL}`, { headers: defaultHeaders });
    check(res1, { 'status is 200': (r) => r.status === 200 });
    sleep(1); // Pause for 1 second

    let res2 = http.get(`${BASE_URL}/contact.php`, { headers: defaultHeaders });
    check(res2, { 'status is 200': (r) => r.status === 200 });
    sleep(2); // Pause for 2 seconds

    let res3 = http.get(`${BASE_URL}/news.php`, { headers: defaultHeaders });
    check(res3, { 'status is 200': (r) => r.status === 200 });
    sleep(2); // Pause for 2 seconds before the next iteration
}