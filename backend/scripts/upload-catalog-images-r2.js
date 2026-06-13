/**
 * Upload all processing/images/*.png to R2. Saves mapping for DB update.
 * Run: node scripts/upload-catalog-images-r2.js
 */
require('../src/config/loadEnv');
const fs = require('fs');
const path = require('path');
const { uploadBuffer, assertR2Config } = require('./r2-upload');

const MANIFEST = path.resolve(__dirname, '../../processing/products.json');
const IMG_DIR = path.resolve(__dirname, '../../processing/images');
const OUT = path.resolve(__dirname, '../../processing/r2-urls.json');

async function main() {
  assertR2Config();
  const force = process.argv.includes('--force');
  const { products } = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  const map = force || !fs.existsSync(OUT) ? {} : JSON.parse(fs.readFileSync(OUT, 'utf8'));

  let uploaded = 0;
  let skipped = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    if (!p.imageFile || (!force && map[p.item_code])) {
      skipped += 1;
      continue;
    }
    const filePath = path.join(IMG_DIR, p.imageFile);
    if (!fs.existsSync(filePath)) continue;

    const key = `products/parts/${p.item_code.replace(/[^a-zA-Z0-9-_]/g, '_')}.png`;
    const url = await uploadBuffer(key, fs.readFileSync(filePath), 'image/png');
    map[p.item_code] = url;
    uploaded += 1;

    if (uploaded % 25 === 0) {
      fs.writeFileSync(OUT, JSON.stringify(map, null, 2));
      console.log(`Uploaded ${uploaded} | ${i + 1}/${products.length}`);
    }
  }

  fs.writeFileSync(OUT, JSON.stringify(map, null, 2));
  console.log('Done. Uploaded:', uploaded, 'Skipped (cached):', skipped, 'Total URLs:', Object.keys(map).length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
