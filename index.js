#!/usr/bin/env node
'use strict';

console.log('[hostinger] Starting Crown Eve API...');
console.log('[hostinger] cwd:', process.cwd());
console.log('[hostinger] NODE_ENV:', process.env.NODE_ENV || 'unset');
console.log('[hostinger] DATABASE_URL:', process.env.DATABASE_URL ? 'set' : 'MISSING');
console.log('[hostinger] JWT_SECRET:', process.env.JWT_SECRET ? 'set' : 'MISSING');
console.log('[hostinger] PORT:', process.env.PORT || '3000 (default)');

require('./backend/index.js');
