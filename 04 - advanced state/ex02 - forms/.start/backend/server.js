// Study steps API for SDEV2171 lessons 13 to 16.
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

  if (url.pathname !== '/api/study-steps' || req.method !== 'GET') {
    res.writeHead(404);
    res.end(JSON.stringify({ error: `No route for ${req.method} ${url.pathname}` }));
    return;
  }

  console.log(`${req.method} ${req.url}`);

  // Log when the app gives up on a request before the server answers.
  let answered = false;
  res.on('close', () => {
    if (!answered) console.log(`  cancelled by the app: ${req.url}`);
  });

  setTimeout(() => {
    if (res.destroyed) return;
    answered = true;

    if (params.get('error') === '1') {
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'The server failed on purpose (error=1).' }));
      return;
    }

    const flaky = Number(params.get('flaky') ?? 0);
    if (flaky > 0) {
      const failed = failures.get(req.url) ?? 0;
      if (failed < flaky) {
        failures.set(req.url, failed + 1);
        res.writeHead(500);
        res.end(JSON.stringify({ error: `The server failed on purpose (flaky=${flaky}, failure ${failed + 1}).` }));
        return;
      }
      failures.delete(req.url);
    }

    res.writeHead(200);
    res.end(JSON.stringify(steps.filter((step) => step.label.toLowerCase().includes(q))));
  }, delay);
});

server.listen(PORT, () => {
  console.log(`Study steps API on http://localhost:${PORT}/api/study-steps`);
});
