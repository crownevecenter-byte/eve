// backend/prisma/seed.js
require('../src/config/loadEnv');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const SEED_PASSWORD = '11223344';

async function main() {
  const hashedPassword = await bcrypt.hash(SEED_PASSWORD, 10);
  const verified = { password: hashedPassword, isVerified: true };

  const branch = await prisma.branch.upsert({
    where: { id: 1 },
    update: {
      name: 'Hadi Ev Center - Chishtian',
      location: 'Hadi Ev Center, Bahawalnagar road Chishtian',
      phone: '0300 698 3345, 0300 449 4545',
    },
    create: {
      id: 1,
      name: 'Hadi Ev Center - Chishtian',
      location: 'Hadi Ev Center, Bahawalnagar road Chishtian',
      phone: '0300 698 3345, 0300 449 4545',
    },
  });

  await prisma.branch.upsert({
    where: { id: 2 },
    update: {
      name: 'Hadi Ev Center - Lahore',
      location: 'Main Ferozepur Road, Near Metro Station, Lahore',
      phone: '0300 698 3345, 0300 449 4545',
    },
    create: {
      id: 2,
      name: 'Hadi Ev Center - Lahore',
      location: 'Main Ferozepur Road, Near Metro Station, Lahore',
      phone: '0300 698 3345, 0300 449 4545',
    },
  });

  const users = [
    {
      email: 'tech@gmail.com',
      name: 'Expert Technician',
      role: 'TECHNICIAN',
      branchId: branch.id,
    },
    {
      email: 'manager@gmail.com',
      name: 'Branch Manager',
      role: 'BRANCH_MANAGER',
      branchId: branch.id,
    },
    {
      email: 'employee@gmail.com',
      name: 'Sales Employee',
      role: 'EMPLOYEE',
      branchId: branch.id,
    },
    {
      email: 'customer@gmail.com',
      name: 'Valued Customer',
      role: 'CUSTOMER',
      branchId: null,
    },
    {
      email: 'branch@gmail.com',
      name: 'Branch Owner',
      role: 'BRANCH_OWNER',
      branchId: branch.id,
    },
    {
      email: 'owner@crowneve.com',
      name: 'Company Owner',
      role: 'COMPANY_OWNER',
      branchId: null,
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { ...verified, name: u.name, role: u.role, branchId: u.branchId },
      create: { ...u, ...verified },
    });
  }

  await prisma.category.upsert({ where: { name: 'Electric Bikes' }, update: {}, create: { name: 'Electric Bikes' } });
  await prisma.brand.upsert({ where: { name: 'Crown EV' }, update: {}, create: { name: 'Crown EV', country: 'Pakistan' } });
  await prisma.serviceCategory.upsert({ where: { name: 'Mechanical' }, update: {}, create: { name: 'Mechanical' } });

  console.log(`Seeding finished. All accounts use password: ${SEED_PASSWORD} (isVerified: true)`);
  console.log('Emails:', users.map((u) => u.email).join(', '));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
