/**
 * Fix mismatched part images end-to-end:
 * 1) Re-parse abc.pdf → processing/images + products.json
 * 2) Re-upload to R2 (overwrites wrong files)
 * 3) Link URLs to all branch products by item_code
 *
 * Run from backend/:  npm run repair:catalog-images
 */
require('../src/config/loadEnv');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const ROOT = path.resolve(__dirname, '../..');
const MANIFEST = path.join(ROOT, 'processing/products.json');
const URLS = path.join(ROOT, 'processing/r2-urls.json');
const BRANCH_IDS = [1, 2];

const slugFor = (branchId, itemCode) =>
  `b${branchId}-${itemCode}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');

const CHUNK = 200;

async function linkFromManifest() {
  if (!fs.existsSync(MANIFEST)) throw new Error('Missing products.json');
  const { products } = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  const urlMap = fs.existsSync(URLS) ? JSON.parse(fs.readFileSync(URLS, 'utf8')) : {};

  const targets = [];
  let missingUrl = 0;

  for (const p of products) {
    if (!p.item_code || !p.imageFile) continue;
    const url = urlMap[p.item_code];
    if (!url) {
      missingUrl += 1;
      continue;
    }
    for (const branchId of BRANCH_IDS) {
      targets.push({ slug: slugFor(branchId, p.item_code), url });
    }
  }

  const slugToId = new Map();
  const slugs = targets.map((t) => t.slug);
  for (let i = 0; i < slugs.length; i += CHUNK) {
    const rows = await prisma.product.findMany({
      where: { slug: { in: slugs.slice(i, i + CHUNK) } },
      select: { id: true, slug: true },
    });
    rows.forEach((r) => slugToId.set(r.slug, r.id));
  }

  const imageRows = [];
  let missingProduct = 0;
  for (const t of targets) {
    const productId = slugToId.get(t.slug);
    if (!productId) {
      missingProduct += 1;
      continue;
    }
    imageRows.push({
      productId,
      url: t.url,
      is_primary: true,
      sort_order: 0,
    });
  }

  const productIds = [...new Set(imageRows.map((r) => r.productId))];
  for (let i = 0; i < productIds.length; i += CHUNK) {
    await prisma.productImage.deleteMany({
      where: { productId: { in: productIds.slice(i, i + CHUNK) } },
    });
  }

  for (let i = 0; i < imageRows.length; i += CHUNK) {
    await prisma.productImage.createMany({
      data: imageRows.slice(i, i + CHUNK),
    });
  }

  console.log(
    'DB linked:',
    imageRows.length,
    '| missing product:',
    missingProduct,
    '| missing R2 url:',
    missingUrl
  );
}

async function main() {
  if (process.argv.includes('--link-only')) {
    console.log('Linking images in database from manifest + r2-urls.json…');
    await linkFromManifest();
    console.log('DB link complete.');
    return;
  }

  console.log('Step 1/3: Re-parse PDF catalog…');
  execSync('node scripts/parse-pdf-catalog.js', { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' });

  console.log('\nStep 2/3: Re-upload images to R2 (force overwrite)…');
  execSync('node scripts/upload-catalog-images-r2.js --force', {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit',
  });

  console.log('\nStep 3/3: Link images in database…');
  await linkFromManifest();

  console.log('\nRepair complete.');
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

module.exports = { linkFromManifest };
