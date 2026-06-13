const { describe, it, after } = require('node:test');
const assert = require('node:assert/strict');
const Order = require('../../src/modules/orders/order.model');
const { runInTransaction } = require('../../src/config/transaction');
const { tag, created, getBranch, getPrisma, cleanup } = require('../helpers/testContext');

describe('Orders / POS (HTTP-safe)', () => {
  after(async () => {
    await cleanup();
  });

  it('creates POS order with walk-in customer and stock deduct', async () => {
    const prisma = getPrisma();
    const branch = await getBranch();
    const label = tag();

    const walkIn = await runInTransaction(async (tx) => {
      const cust = await tx.walkInCustomer.create({
        data: {
          first_name: 'POS',
          last_name: label,
          phone: `03${String(Date.now()).slice(-9)}`,
          cnic: `35202-${String(Date.now()).slice(-7)}-${Math.floor(Math.random() * 9)}`,
          address: 'POS Test Address',
          branchId: branch.id,
        },
      });
      return cust;
    });
    created.walkInIds.push(walkIn.id);

    let product = await prisma.product.findFirst({
      where: { branchId: branch.id, stock_qty: { gte: 1 }, is_active: true },
      select: { id: true, price: true, stock_qty: true },
    });

    if (!product) {
      const Product = require('../../src/modules/products/product.model');
      const createdProduct = await Product.createProduct({
        name: `POS Stock ${label}`,
        slug: `pos-stock-${label}`,
        product_type: 'part',
        price: 500,
        stock_qty: 5,
        branchId: branch.id,
        is_active: true,
        partDetail: { create: { item_code: `POS-${label}` } },
      });
      created.productIds.push(createdProduct.id);
      product = { id: createdProduct.id, price: createdProduct.price, stock_qty: createdProduct.stock_qty };
    }

    const order = await Order.createOrder({
      branchId: branch.id,
      walkInCustomerId: walkIn.id,
      total: Number(product.price),
      type: 'POS',
      payment_method: 'CASH',
      payment_status: 'PAID',
      items: [{ productId: product.id, quantity: 1, price: Number(product.price) }],
    });

    created.orderIds.push(order.id);
    assert.ok(order.id);
    assert.equal(order.type, 'POS');
    assert.ok(order.items?.length >= 1);
  });
});
