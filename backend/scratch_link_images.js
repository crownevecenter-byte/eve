const fs = require('fs');
const prisma = require('./src/config/db.js');

async function linkImages() {
  try {
    const r2UrlsPath = 'd:/Crown eve/crown-eve-center/processing/r2-urls.json';
    if (!fs.existsSync(r2UrlsPath)) {
      console.log('No r2-urls.json found!');
      process.exit(1);
    }

    const urlsMap = JSON.parse(fs.readFileSync(r2UrlsPath, 'utf8'));
    console.log(`Loaded ${Object.keys(urlsMap).length} URLs from cache.`);

    // Find products without images
    const products = await prisma.product.findMany({
      where: {
        images: { none: {} }
      },
      include: {
        partDetail: true
      }
    });

    console.log(`Found ${products.length} products without images.`);

    let linkedCount = 0;

    for (const p of products) {
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

    console.log(`✅ Successfully linked ${linkedCount} missing images to products.`);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

linkImages();
