#!/usr/bin/env node
'use strict';

const { execSync } = require('child_process');
const path = require('path');

const backendDir = path.join(__dirname, '..', 'backend');

console.log('[hostinger-build] Installing backend dependencies (isolated)...');
execSync('npm install --omit=dev --ignore-workspaces', { cwd: backendDir, stdio: 'inherit' });

console.log('[hostinger-build] Generating Prisma client...');
execSync('npx prisma generate', { cwd: backendDir, stdio: 'inherit' });

console.log('[hostinger-build] Done.');
