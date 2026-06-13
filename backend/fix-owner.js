// backend/fix-owner.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  console.log('Fixing Owner role...');
  const user = await prisma.user.update({
    where: { email: 'owner@crowneve.com' },
    data: { role: 'COMPANY_OWNER' }
  });
  console.log('Success! User updated:', user.email, 'Role:', user.role);
}

fix().catch(err => {
  console.error('Error fixing user:', err.message);
}).finally(() => prisma.$disconnect());
