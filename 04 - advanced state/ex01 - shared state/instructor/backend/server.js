// Study steps API for SDEV2171 lessons 13 and 15.
// Run with: node server.js
import http from 'node:http';
import { readFile } from 'node:fs/promises';

const PORT = 3000;
const steps = JSON.parse(await readFile(new URL('./study-steps.json', import.meta.url), 'utf8'));

// For flaky=N: how many times each URL has failed in a row.
const failures = new Map();

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const params = url.searchParams;
  const q = (params.get('q') ?? '').trim().toLowerCase();

  // Test controls. They can be combined.
  //   delay=1500   wait 1500 ms before answering
  //   error=1      answer with a 500 error
  //   race=1       shorter searches answer slower (2000 ms minus 400 ms per character, min 200 ms)
  //   flaky=2      fail the first 2 requests to the same URL, then succeed once, then start over
  let delay = Number(params.get('delay') ?? 0);
  if (params.get('race') === '1') delay += Math.max(200, 2000 - 400 * q.length);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  console.log(`${req.method} ${url.pathname}${url.search}  answering in ${delay} ms`);

  let status = 200;
  let body;

  if (url.pathname !== '/api/study-steps') {
    status = 404;
    body = { error: `No endpoint at ${url.pathname}` };
  } else if (params.get('error') === '1') {
    status = 500;
    body = { error: 'The server failed on purpose (error=1).' };
  } else if (params.has('flaky') && (failures.get(req.url) ?? 0) < Number(params.get('flaky'))) {
    const count = (failures.get(req.url) ?? 0) + 1;
    failures.set(req.url, count);
    status = 500;
    body = { error: `Flaky failure ${count} of ${params.get('flaky')}.` };
  } else {
    failures.delete(req.url);
    body = q ? steps.filter((step) => step.label.toLowerCase().includes(q)) : steps;
  }

  const timer = setTimeout(() => {
    res.statusCode = status;
    res.end(JSON.stringify(body));
  }, delay);

  // If the app cancels the request, stop waiting and say so.
  res.on('close', () => {
    if (!res.writableEnded) {
      clearTimeout(timer);
      console.log(`  cancelled by the app: ${url.search || '(no query)'}`);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Study steps API running at http://localhost:${PORT}/api/study-steps`);
});
