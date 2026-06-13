const prisma = require('./src/config/db.js');

async function checkProduct() {
  const product = await prisma.product.findFirst({
    where: { name: { contains: "MINI CLASSIC WIRING DUST" } },
    include: { images: true }
  });
  console.log(JSON.stringify(product, null, 2));
  process.exit();
}
checkProduct();
