const fs = require('fs');
const prisma = require('./src/config/db.js');

async function linkImages() {
  try {
    const r2UrlsPath = 'd:/Crown eve/crown-eve-center/processing/r2-urls.json';
    const urlsMap = JSON.parse(fs.readFileSync(r2UrlsPath, 'utf8'));
    console.log(`Loaded ${Object.keys(urlsMap).length} URLs from cache.`);

    const products = await prisma.$queryRaw`
      SELECT p.id as "productId", pd.item_code
      FROM "Product" p
      JOIN "PartDetail" pd ON p.id = pd."productId"
      LEFT JOIN "ProductImage" pi ON p.id = pi."productId"
      WHERE pi.id IS NULL
    `;

    console.log(`Found ${products.length} products without images.`);
    let linkedCount = 0;

    for (const p of products) {
      if (!p.item_code) continue;
      
      const imgUrl = urlsMap[p.item_code];
      
      if (imgUrl) {
        await prisma.productImage.create({
          data: {
            productId: p.productId,
            url: imgUrl,
            is_primary: true,
            sort_order: 0
          }
        });
        linkedCount++;
      }
    }

    console.log(`✅ Successfully linked ${linkedCount} missing images.`);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}
linkImages();
