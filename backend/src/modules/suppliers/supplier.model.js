// backend/src/modules/suppliers/supplier.model.js
const prisma = require('../../config/db');
const { sequentialOnHttp } = require('../../utils/sequentialOnHttp');
const { runInTransaction } = require('../../config/transaction');
const { ensureSupplierAccount } = require('../../services/ledger.service');

const getAllSuppliers = async ({ page = 1, limit = 100 } = {}) => {
  const take = Math.min(Number(limit) || 100, 200);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;
  const [data, total] = await sequentialOnHttp([
    () =>
      prisma.supplier.findMany({
        skip,
        take,
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          contact: true,
          accountId: true,
          account: { select: { id: true, account_name: true, current_balance: true } },
        },
      }),
    () => prisma.supplier.count(),
  ]);
  return {
    data,
    meta: { total, page: Number(page) || 1, limit: take, totalPages: Math.ceil(total / take) },
  };
};

const createSupplier = async (data) => {
  const { branchId, ...supplierData } = data;
  const bId = branchId ? Number(branchId) : (await prisma.branch.findFirst({ select: { id: true } }))?.id;
  if (!bId) throw new Error('Branch ID is required to create supplier ledger.');

  return runInTransaction(async (tx) => {
    const supplier = await tx.supplier.create({ data: supplierData });
    await ensureSupplierAccount(tx, supplier.id, bId);
    return tx.supplier.findUnique({
      where: { id: supplier.id },
      include: { account: true },
    });
  });
};

const updateSupplier = async (id, data) => {
  const existing = await prisma.supplier.findUnique({ where: { id: Number(id) } });
  if (!existing) throw new Error('Supplier not found.');

  const supplierId = Number(id);
  await prisma.supplier.update({
    where: { id: supplierId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.contact !== undefined && { contact: data.contact }),
    },
  });
  // No nested select on update — PrismaNeonHTTP rejects it as a transaction
  return prisma.supplier.findUnique({
    where: { id: supplierId },
    select: {
      id: true,
      name: true,
      contact: true,
      accountId: true,
      account: { select: { id: true, account_name: true, current_balance: true } },
    },
  });
};

const deleteSupplier = async (id) => {
  const supplierId = Number(id);
  const existing = await prisma.supplier.findUnique({ where: { id: supplierId } });
  if (!existing) throw new Error('Supplier not found.');

  const purchaseCount = await prisma.purchase.count({ where: { supplierId } });
  if (purchaseCount > 0) {
    throw new Error('Cannot delete supplier with existing purchase orders.');
  }

  await prisma.supplier.delete({ where: { id: supplierId } });
  return { id: supplierId };
};

module.exports = { getAllSuppliers, createSupplier, updateSupplier, deleteSupplier };
