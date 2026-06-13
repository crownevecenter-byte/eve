const fs = require('fs');
const prisma = require('./src/config/db.js');

async function linkImages() {
  try {
    const r2UrlsPath = 'd:/Crown eve/crown-eve-center/processing/r2-urls.json';
    const urlsMap = JSON.parse(fs.readFileSync(r2UrlsPath, 'utf8'));
    console.log(`Loaded ${Object.keys(urlsMap).length} URLs from cache.`);

    const products = await prisma.product.findMany({
      include: {
        partDetail: true,
        images: true
      }
    });

    console.log(`Fetched ${products.length} products.`);
    let linkedCount = 0;

    for (const p of products) {
      if (p.images.length > 0) continue; // Already has image
      if (!p.partDetail || !p.partDetail.item_code) continue;
      
      const imgUrl = urlsMap[p.partDetail.item_code];
      
      if (imgUrl) {
        await prisma.productImage.create({
          data: {
            productId: p.id,
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
