/**
 * PrismaNeonHTTP rejects several write patterns (they start internal transactions):
 * - create/update with `include`
 * - updateMany, createMany
 * - nested writes (e.g. images: { create: [...] }, upsert)
 * Use these helpers inside runInTransaction() callbacks.
 */

const updateAndFetch = async (tx, delegate, { where, data, include, select }) => {
  await delegate.update({ where, data });
  if (select) return delegate.findUnique({ where, select });
  return delegate.findUnique({ where, include });
};

const createAndFetch = async (tx, delegate, { data, include, select }) => {
  const created = await delegate.create({ data });
  const where = { id: created.id };
  if (select) return delegate.findUnique({ where, select });
  return delegate.findUnique({ where, include });
};

const upsertOneToOne = async (tx, delegate, productId, payload) => {
  const existing = await delegate.findUnique({ where: { productId } });
  if (existing) {
    return delegate.update({ where: { productId }, data: payload });
  }
  return delegate.create({ data: { ...payload, productId } });
};

const updateManySequential = async (tx, delegate, where, data) => {
  const rows = await delegate.findMany({ where, select: { id: true } });
  for (const row of rows) {
    await delegate.update({ where: { id: row.id }, data });
  }
  return rows.length;
};

const deleteManySequential = async (tx, delegate, where) => {
  const rows = await delegate.findMany({ where, select: { id: true } });
  for (const row of rows) {
    await delegate.delete({ where: { id: row.id } });
  }
  return rows.length;
};

const replaceChildRecords = async (tx, delegate, parentField, parentId, records, mapCreate) => {
  await deleteManySequential(tx, delegate, { [parentField]: parentId });
  for (const rec of records) {
    await delegate.create({ data: mapCreate(rec, parentId) });
  }
};

module.exports = {
  updateAndFetch,
  createAndFetch,
  upsertOneToOne,
  updateManySequential,
  deleteManySequential,
  replaceChildRecords,
};
