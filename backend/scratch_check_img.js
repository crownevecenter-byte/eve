const prisma = require('./src/config/db.js');

async function checkImageFlags() {
  const image = await prisma.productImage.findFirst();
  console.log(image);
  process.exit();
}
checkImageFlags();
