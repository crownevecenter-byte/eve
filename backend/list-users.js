const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const users = await prisma.user.findMany({
    select: { email: true, role: true }
  });
  console.log(JSON.stringify(users, null, 2));
}

run()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
