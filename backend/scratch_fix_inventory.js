const prisma = require('./src/config/db.js');

async function fixInventory() {
  try {
    const products = await prisma.product.findMany({
      where: { product_type: 'part' },
      include: { category: true, productParts: true }
    });

    const productsToFix = products.filter(p => p.productParts.length === 0);
    console.log(`Found ${productsToFix.length} products needing fix.`);

    let count = 0;
    // Sequential execution to prevent overwhelming the serverless DB
    for (const product of productsToFix) {
      try {
        // 1. Create global part
        const part = await prisma.part.create({
          data: {
            name: product.name,
            category: product.category ? product.category.name : 'Uncategorized',
            price: product.price,
            stock: product.stock_qty || 0
          }
        });

        // 2. Link to product
        await prisma.productPart.create({
          data: {
            productId: product.id,
            partId: part.id,
            quantity: 1
          }
        });

        // 3. Create branch inventory record
        await prisma.inventory.create({
          data: {
            branchId: product.branchId,
            partId: part.id,
            stock: product.stock_qty || 0,
            alertAt: 5
          }
        });

        count++;
        if (count % 50 === 0) {
          console.log(`Processed ${count} / ${productsToFix.length}`);
        }
      } catch (err) {
        console.error(`Error processing product ${product.id}:`, err.message);
      }
    }

    console.log(`✅ ${count} missing inventory records have been created successfully!`);
  } catch (error) {
    console.error("Error fetching products:", error);
  } finally {
    process.exit(0);
  }
}

fixInventory();
