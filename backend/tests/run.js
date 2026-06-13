const { spawnSync } = require('child_process');
const { readdirSync, statSync } = require('fs');
const path = require('path');

const collectTests = (dir, acc = []) => {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === 'helpers') continue;
      collectTests(full, acc);
    } else if (entry.endsWith('.test.js')) {
      acc.push(full);
    }
  }
  return acc;
};

const backendRoot = path.join(__dirname, '..');
const files = collectTests(__dirname).sort();

if (!files.length) {
  console.error('No test files found.');
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  ['--test', '--test-reporter=spec', ...files],
  { stdio: 'inherit', cwd: backendRoot }
);

process.exit(result.status ?? 1);
