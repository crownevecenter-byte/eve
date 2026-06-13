/**
 * Seed parts catalog from processing/products.json (from abc.pdf).
 */
require('../src/config/loadEnv');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { uploadBuffer, assertR2Config } = require('../src/utils/r2-upload');

const prisma = new PrismaClient();

const ROOT = path.resolve(__dirname, '../..');
const MANIFEST = path.join(ROOT, 'processing/products.json');
const IMG_DIR = path.join(ROOT, 'processing/images');
const BRANCH_IDS = [1, 2];
const CONCURRENCY = 6;
const DEFAULT_STOCK = 10;
const CATEGORY_NAME = 'Spare Parts';
const BRAND_NAME = 'Crown EV';

const slugFor = (branchId, itemCode) =>
  `b${branchId}-${itemCode}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');

async function ensureRefs() {
  const category = await prisma.category.upsert({
    where: { name: CATEGORY_NAME },
    update: {},
    create: { name: CATEGORY_NAME },
  });
  const brand = await prisma.brand.upsert({
    where: { name: BRAND_NAME },
    update: {},
    create: { name: BRAND_NAME, country: 'Pakistan' },
  });
  return { categoryId: category.id, brandId: brand.id };
}

async function upsertOneProduct(p, branchId, refs, imageUrl) {
  const slug = slugFor(branchId, p.item_code);
  const partPayload = {
    serial_no: p.serial_no,
    item_code: p.item_code,
    model: p.model,
    description: p.description,
    cp_price: p.cp_price,
    unit: 'piece',
  };

  const product = await prisma.product.upsert({
    where: { slug },
    create: {
      name: (p.name || `${p.model} — ${p.description}`).slice(0, 255),
      slug,
      product_type: 'part',
      description: p.description || null,
      price: p.price || p.cp_price || 0,
      sale_price: null,
      stock_qty: DEFAULT_STOCK,
      categoryId: refs.categoryId,
      brandId: refs.brandId,
      branchId,
      is_active: true,
      partDetail: { create: partPayload },
      images: imageUrl ? { create: [{ url: imageUrl, is_primary: true, sort_order: 0 }] } : undefined,
    },
    update: {
      name: (p.name || `${p.model} — ${p.description}`).slice(0, 255),
      description: p.description || null,
      price: p.price || p.cp_price || 0,
      stock_qty: DEFAULT_STOCK,
      categoryId: refs.categoryId,
      brandId: refs.brandId,
      is_active: true,
      partDetail: { upsert: { create: partPayload, update: partPayload } },
    },
    select: { id: true, createdAt: true },
  });

  if (imageUrl) {
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.create({
      data: { productId: product.id, url: imageUrl, is_primary: true, sort_order: 0 },
    });
  }

  const ageMs = Date.now() - new Date(product.createdAt).getTime();
  return ageMs < 3000 ? 'created' : 'updated';
}

async function seedProduct(p, refs, imageUrlCache, r2Enabled, stats) {
  let imageUrl = null;
  if (r2Enabled && p.imageFile) {
    if (!imageUrlCache.has(p.item_code)) {
      const filePath = path.join(IMG_DIR, p.imageFile);
      if (fs.existsSync(filePath)) {
        const buffer = fs.readFileSync(filePath);
        const key = `products/parts/${p.item_code.replace(/[^a-zA-Z0-9-_]/g, '_')}.webp`;
        const { imageBufferToWebp } = require('../src/utils/mediaConvert');
        const webpBuffer = await imageBufferToWebp(buffer);
        imageUrl = await uploadBuffer(key, webpBuffer, 'image/webp');
        imageUrlCache.set(p.item_code, imageUrl);
        stats.uploaded += 1;
      }
    } else {
      imageUrl = imageUrlCache.get(p.item_code);
    }
  }

  const results = await Promise.all(
    BRANCH_IDS.map((branchId) => upsertOneProduct(p, branchId, refs, imageUrl))
  );
  results.forEach((r) => {
    if (r === 'created') stats.created += 1;
    else stats.updated += 1;
  });
}

async function runPool(items, concurrency, worker) {
  let index = 0;
  async function workerLoop() {
    while (index < items.length) {
      const i = index++;
      await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, workerLoop));
}

async function main() {
  if (!fs.existsSync(MANIFEST)) {
    throw new Error(`Missing ${MANIFEST}. Run: npm run parse:catalog`);
  }

  let r2Enabled = true;
  try {
    assertR2Config();
  } catch {
    r2Enabled = false;
    console.warn('⚠ R2 not configured — DB only (no images). Add R2_* env and re-run for pictures.');
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  const products = manifest.products || [];
  console.log(`Seeding ${products.length} parts × ${BRANCH_IDS.length} branches (concurrency ${CONCURRENCY})…`);

  const refs = await ensureRefs();
  const imageUrlCache = new Map();
  const stats = { created: 0, updated: 0, uploaded: 0, done: 0 };

  await runPool(products, CONCURRENCY, async (p) => {
    await seedProduct(p, refs, imageUrlCache, r2Enabled, stats);
    stats.done += 1;
    if (stats.done % 100 === 0 || stats.done === products.length) {
      console.log(`Progress: ${stats.done} / ${products.length}`);
    }
  });

  console.log('\nDone.');
  console.log('R2 images uploaded:', imageUrlCache.size);
  console.log('Created:', stats.created, '| Updated:', stats.updated);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
