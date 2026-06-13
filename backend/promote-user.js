// backend/promote-user.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const email = process.argv[2];

if (!email) {
  console.error('Usage: node backend/promote-user.js <email>');
  process.exit(1);
}

async function promote() {
  console.log(`Promoting ${email} to COMPANY_OWNER...`);
  try {
    const user = await prisma.user.update({
      where: { email },
      data: { role: 'COMPANY_OWNER' }
    });
    console.log('Success! User updated:', user.email, 'Role:', user.role);
  } catch (err) {
    console.error('Error: Could not find user with email:', email);
  }
}

promote().catch(err => {
  console.error('Error:', err.message);
}).finally(() => prisma.$disconnect());
