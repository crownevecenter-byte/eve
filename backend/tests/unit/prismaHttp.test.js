const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  updateManySequential,
  deleteManySequential,
  upsertOneToOne,
} = require('../../src/config/prismaHttp');
const { getPrisma, getBranch, tag } = require('../helpers/testContext');

describe('prismaHttp helpers', () => {
  it('updateManySequential updates matching rows', async () => {
    const prisma = getPrisma();
    const branch = await getBranch();
    const user = await prisma.user.findFirst({
      where: { branchId: branch.id },
      select: { id: true, name: true },
    });
    if (!user) return;

    const count = await updateManySequential(
      prisma,
      prisma.user,
      { id: user.id },
      { name: user.name }
    );
    assert.equal(count, 1);
  });

  it('deleteManySequential is a no-op for empty match', async () => {
    const prisma = getPrisma();
    const count = await deleteManySequential(prisma, prisma.productImage, {
      id: '00000000-0000-0000-0000-000000000000',
    });
    assert.equal(count, 0);
  });

  it('upsertOneToOne creates then updates bike detail', async () => {
    const prisma = getPrisma();
    const branch = await getBranch();
    const Product = require('../../src/modules/products/product.model');

    const product = await Product.createProduct({
      name: `Bike ${tag()}`,
      slug: `bike-${tag()}`,
      product_type: 'bike',
      price: 50000,
      stock_qty: 1,
      branchId: branch.id,
      is_active: true,
      bikeDetail: { create: { motor_type: 'BLDC' } },
    });

    try {
      await upsertOneToOne(prisma, prisma.bike, product.id, { motor_type: 'Updated BLDC' });
      const bike = await prisma.bike.findUnique({ where: { productId: product.id } });
      assert.equal(bike.motor_type, 'Updated BLDC');
    } finally {
      await prisma.productImage.deleteMany({ where: { productId: product.id } });
      await prisma.bike.deleteMany({ where: { productId: product.id } });
      await prisma.product.delete({ where: { id: product.id } });
    }
  });
});
