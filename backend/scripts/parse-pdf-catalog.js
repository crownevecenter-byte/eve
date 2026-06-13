/**
 * Parse abc.pdf parts catalog → JSON + per-product image files.
 * Output: processing/products.json + processing/images/{itemCode}.png
 */
const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const pdfPath = path.resolve(__dirname, '../../abc.pdf');
const outDir = path.resolve(__dirname, '../../processing');
const imgDir = path.join(outDir, 'images');

const ITEM_CODE_RE = /^[A-Z]{2}-[A-Z0-9-]+$/;
const LINE_RE =
  /^(\d+)\s+([A-Z]{2}-[A-Z0-9-]+)\s+(.+?)\s+([\d,]+)\s*$/;

const MODEL_STOP_WORDS = new Set([
  'ALLOY', 'BACK', 'B/L', 'AXLE', 'BULB', 'RIM', 'LIGHT', 'REST', 'COVER', 'FRAME',
  'LENS', 'COMPLETE', 'BASE', 'BRACKET', 'PLASTIC', 'REFLECTOR', 'DECORATIVE',
  'INDICATOR', 'CENTER', 'FRONT', 'REAR', 'LEFT', 'RIGHT', 'CABLE', 'METER',
  'SWITCH', 'HORN', 'GRIP', 'MIRROR', 'SEAT', 'FENDER', 'SHOCK', 'TYRE', 'TUBE',
  'BRAKE', 'DISC', 'PAD', 'CHAIN', 'SPROCKET', 'MOTOR', 'CONTROLLER', 'BATTERY',
]);

function splitModelDescription(middle) {
  const tokens = middle.trim().split(/\s+/);
  if (!tokens.length) return { model: null, description: middle };

  const modelTokens = [];
  for (let i = 0; i < Math.min(tokens.length, 4); i++) {
    const t = tokens[i];
    if (MODEL_STOP_WORDS.has(t.toUpperCase())) break;
    modelTokens.push(t);
    if (modelTokens.length >= 3 && /^\d/.test(tokens[i + 1] || '')) break;
  }
  if (!modelTokens.length) modelTokens.push(tokens[0]);
  const model = modelTokens.join(' ');
  const description = tokens.slice(modelTokens.length).join(' ') || middle;
  return { model, description };
}

function parseLine(line) {
  const m = line.trim().match(LINE_RE);
  if (!m) return null;
  const [, serial, itemCode, middle, priceRaw] = m;
  if (!ITEM_CODE_RE.test(itemCode)) return null;
  const { model, description } = splitModelDescription(middle);
  return {
    serial_no: parseInt(serial, 10),
    item_code: itemCode,
    model,
    description: description.trim(),
    name: `${model} — ${description}`.slice(0, 255),
    cp_price: parseFloat(priceRaw.replace(/,/g, '')),
    price: parseFloat(priceRaw.replace(/,/g, '')),
  };
}

function parsePageText(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const products = [];
  for (const line of lines) {
    if (/^S\/0|^EV ITEM|^Item Code|^PAGE/i.test(line)) continue;
    const p = parseLine(line);
    if (p) products.push(p);
  }
  return products;
}

function safeFileName(itemCode) {
  return itemCode.replace(/[^a-zA-Z0-9-_]/g, '_');
}

/** Trailing number in pdf-parse image name, e.g. img_p0_14 → 14 */
function imageSlotNumber(name) {
  const m = String(name || '').match(/_(\d+)$/);
  return m ? parseInt(m[1], 10) : 0;
}

/**
 * Dedupe by image name and sort by numeric slot (NOT localeCompare — img_p0_10 must follow img_p0_9).
 */
function normalizePageImages(pageImages) {
  const byName = new Map();
  for (const img of pageImages || []) {
    if (!img?.data?.length || !img.name) continue;
    if (!byName.has(img.name)) byName.set(img.name, img);
  }
  return [...byName.values()].sort(
    (a, b) => imageSlotNumber(a.name) - imageSlotNumber(b.name)
  );
}

async function main() {
  fs.mkdirSync(imgDir, { recursive: true });
  const buffer = fs.readFileSync(pdfPath);
  const parser = new PDFParse({ data: buffer });

  const textResult = await parser.getText();
  const imgResult = await parser.getImage({ imageThreshold: 80 });

  const allProducts = [];
  const pageCount = textResult.pages?.length || 0;

  for (let i = 0; i < pageCount; i++) {
    const pageNum = i + 1;
    const pageText = textResult.pages[i]?.text || '';
    const pageProducts = parsePageText(pageText);
    const pageImages = imgResult.pages[i]?.images || [];
    const uniqueImages = normalizePageImages(pageImages);

    if (uniqueImages.length !== pageProducts.length) {
      console.warn(
        `Page ${pageNum}: ${pageProducts.length} products, ${uniqueImages.length} images — ` +
          'assigning pictures to first N rows in catalog order.'
      );
    }

    pageProducts.forEach((product, idx) => {
      const img = idx < uniqueImages.length ? uniqueImages[idx] : null;
      let imageFile = null;
      if (img?.data) {
        imageFile = `${safeFileName(product.item_code)}.png`;
        fs.writeFileSync(path.join(imgDir, imageFile), img.data);
      }
      allProducts.push({
        ...product,
        pdfPage: pageNum,
        imageFile,
      });
    });
  }

  await parser.destroy();

  const manifest = {
    source: 'abc.pdf',
    extractedAt: new Date().toISOString(),
    totalProducts: allProducts.length,
    withImages: allProducts.filter((p) => p.imageFile).length,
    products: allProducts,
  };

  fs.writeFileSync(path.join(outDir, 'products.json'), JSON.stringify(manifest, null, 2));

  console.log('Products parsed:', manifest.totalProducts);
  console.log('With images:', manifest.withImages);
  console.log('Written:', path.join(outDir, 'products.json'));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
