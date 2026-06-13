#!/usr/bin/env node
'use strict';

const path = require('path');

try {
  process.chdir(path.join(__dirname));
} catch {
  // ignore
}

let crashReportActive = false;
function serveCrashReport(err) {
  if (crashReportActive) {
    console.error('[FATAL] Error during crash report serving:', err);
    process.exit(1);
  }
  crashReportActive = true;

  const http = require('http');
  const server = http.createServer((req, res) => {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Crown Eve API Startup Error:\n\n' + (err && err.stack ? err.stack : String(err)));
  });

  server.on('error', (serverErr) => {
    console.error('[FATAL] Fallback server failed to start:', serverErr);
    process.exit(1);
  });

  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`[fallback] Serving crash report on port ${port}`);
  });
}

const initUncaughtHandler = (err) => {
  console.error('[FATAL] Uncaught Exception during startup:', err);
  serveCrashReport(err);
};

process.on('uncaughtException', initUncaughtHandler);

try {
  require(path.join(__dirname, 'src', 'server.js'));
  // Clean up the startup uncaughtException handler once server.js has successfully loaded
  process.removeListener('uncaughtException', initUncaughtHandler);
} catch (err) {
  console.error('[FATAL] Initialization error:', err);
  serveCrashReport(err);
}
