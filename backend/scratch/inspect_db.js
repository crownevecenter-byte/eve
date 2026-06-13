require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.accountCategory.findMany();
  console.log('Categories:', categories);
  const accounts = await prisma.account.findMany();
  console.log('Accounts:', accounts);
  const branches = await prisma.branch.findMany();
  console.log('Branches:', branches);
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
