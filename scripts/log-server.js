#!/usr/bin/env node
// Receives console logs from the simulator app and appends them to debug.log.
// Run: node scripts/log-server.js
// The app POSTs to http://localhost:9999/log

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 9999;
const LOG_FILE = path.join(__dirname, '..', 'debug.log');

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/log') {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      try {
        const { level, args, ts } = JSON.parse(body);
        const line = `[${ts}] [${level.toUpperCase()}] ${args.join(' ')}\n`;
        fs.appendFileSync(LOG_FILE, line);
        process.stdout.write(line);
      } catch (_) {}
      res.writeHead(200);
      res.end();
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/clear') {
    fs.writeFileSync(LOG_FILE, '');
    console.log('--- debug.log cleared ---');
    res.writeHead(200);
    res.end();
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(PORT, '127.0.0.1', () => {
  fs.writeFileSync(LOG_FILE, '');
  console.log(`Log server listening on http://127.0.0.1:${PORT}`);
  console.log(`Writing to: ${LOG_FILE}`);
});
