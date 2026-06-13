/**
 * Link R2 URLs from processing/r2-urls.json to products (both branches).
 * Run after: node scripts/upload-catalog-images-r2.js
 */
require('../src/config/loadEnv');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const URLS = path.resolve(__dirname, '../../processing/r2-urls.json');
const BRANCH_IDS = [1, 2];

const slugFor = (branchId, itemCode) =>
  `b${branchId}-${itemCode}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function linkWithRetry(slug, url, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const product = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
      if (!product) return 'missing';
      await prisma.productImage.deleteMany({ where: { productId: product.id } });
      await prisma.productImage.create({
        data: { productId: product.id, url, is_primary: true, sort_order: 0 },
      });
      return 'ok';
    } catch (e) {
      if (attempt === retries) throw e;
      await sleep(1500 * attempt);
    }
  }
}

async function main() {
  if (!fs.existsSync(URLS)) throw new Error('Missing r2-urls.json — run upload-catalog-images-r2.js first');
  const map = JSON.parse(fs.readFileSync(URLS, 'utf8'));
  const codes = Object.keys(map);
  console.log('Linking', codes.length, 'images ×', BRANCH_IDS.length, 'branches…');

  let ok = 0;
  let missing = 0;

  for (let i = 0; i < codes.length; i++) {
    const itemCode = codes[i];
    const url = map[itemCode];
    for (const branchId of BRANCH_IDS) {
      const slug = slugFor(branchId, itemCode);
      const result = await linkWithRetry(slug, url);
      if (result === 'ok') ok += 1;
      else missing += 1;
    }
    if ((i + 1) % 50 === 0) console.log(`Progress: ${i + 1}/${codes.length}`);
  }

  console.log('Done. Linked:', ok, 'Missing product:', missing);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
