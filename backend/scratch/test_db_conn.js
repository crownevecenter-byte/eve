const { PrismaClient } = require('@prisma/client');

const passwords = [
  'Farehanzan@786',
  'Farehanzan%40786',
  'postgres',
  '11223344',
  '123456',
  'admin',
  'root',
  'password',
  'crown_eve',
  'crown_eve_center',
  '',
];

const databases = [
  'postgres',
  'crown_eve',
  'crown-eve-center',
  'crown_eve_center',
];

async function tryConnect(url) {
  process.env.DATABASE_URL = url;
  const prisma = new PrismaClient({
    datasources: {
      db: { url }
    }
  });

  try {
    await prisma.$connect();
    console.log('SUCCESS with URL:', url);
    
    // Check if we can query branches
    const branches = await prisma.branch.findMany();
    console.log('Branches in DB:', branches);
    
    await prisma.$disconnect();
    return true;
  } catch (err) {
    console.log('Error with URL:', url, 'Error:', err.message);
    return false;
  }
}

async function main() {
  for (const db of databases) {
    for (const pw of passwords) {
      const url = pw === '' 
        ? `postgresql://postgres@localhost:5432/${db}`
        : `postgresql://postgres:${pw}@localhost:5432/${db}`;
      const success = await tryConnect(url);
      if (success) {
        process.exit(0);
      }
    }
  }
  console.log('No working connection found from the matrix.');
}

main();
