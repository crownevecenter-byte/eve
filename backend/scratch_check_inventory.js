const prisma = require('./src/config/db.js');

async function checkInventory() {
  try {
    const partsCount = await prisma.part.count();
    const inventoryCount = await prisma.inventory.count();

    console.log(`--- Inventory Status ---`);
    console.log(`Total Parts: ${partsCount}`);
    console.log(`Total Inventory Records: ${inventoryCount}`);
    console.log(`------------------------`);
  } catch (error) {
    console.error("Error checking inventory:", error);
  } finally {
    process.exit(0);
  }
}

checkInventory();
