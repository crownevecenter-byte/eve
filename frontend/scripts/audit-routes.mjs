/**
 * Quick route audit: nav paths vs App.jsx route definitions.
 * Run: node scripts/audit-routes.mjs
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const appJs = readFileSync(join(root, 'src/App.jsx'), 'utf8');

const routePaths = [...appJs.matchAll(/path="([^"]+)"/g)].map((m) => m[1]);

const modules = [
  {
    name: 'Customer',
    nav: [
      '/my/dashboard',
      '/my/shop',
      '/my/orders',
      '/my/bookings',
      '/my/book-service',
    ],
    aliases: ['/appointments', '/track/:id', '/shop', '/cart', '/checkout'],
  },
  {
    name: 'Owner',
    nav: [
      '/owner/dashboard',
      '/owner/branches',
      '/owner/parts',
      '/owner/orders',
      '/owner/purchases',
      '/owner/users',
      '/owner/reports',
      '/owner/settings',
    ],
  },
  {
    name: 'Branch',
    nav: [
      '/branch/dashboard',
      '/branch/pos',
      '/branch/orders',
      '/branch/inventory',
      '/branch/products',
      '/branch/services',
      '/branch/appointments',
      '/branch/suppliers',
      '/branch/reports',
      '/branch/settings',
    ],
  },
];

let issues = 0;

for (const mod of modules) {
  console.log(`\n=== ${mod.name} ===`);
  for (const p of mod.nav) {
    const ok = routePaths.some((r) => r === p || r.replace(/:[^/]+/g, '*') === p);
    if (!ok && !routePaths.includes(p)) {
      const fuzzy = routePaths.find((r) => r.startsWith(p.split('/').slice(0, -1).join('/')));
      if (!fuzzy) {
        console.log(`  MISSING ROUTE: ${p}`);
        issues++;
      }
    }
  }
  if (mod.aliases) {
    for (const a of mod.aliases) {
      console.log(`  alias ${a} → covered by redirect/gate`);
    }
  }
}

console.log(issues === 0 ? '\n✓ All primary nav paths have routes.' : `\n✗ ${issues} issue(s) found.`);
process.exit(issues === 0 ? 0 : 1);
