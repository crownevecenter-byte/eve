// backend/src/modules/parts/part.controller.js
const Part = require('./part.model');
const prisma = require('../../config/db');
const { runInTransaction } = require('../../config/transaction');

exports.getCount = async (req, res) => {
  try {
    const count = await prisma.part.count();
    res.json({ count });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const result = await Part.getParts(req.query);
    res.json(result);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const part = await Part.getPartById(Number(req.params.id));
    res.json(part);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.create = async (req, res) => {
  try {
    const part = await Part.createPart(req.body);
    res.status(201).json(part);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.update = async (req, res) => {
  try {
    const part = await Part.updatePart(Number(req.params.id), req.body);
    res.json(part);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.remove = async (req, res) => {
  const id = Number(req.params.id);
  try {
    await runInTransaction(async (tx) => {
      // 1. Delete inventory records referencing this part
      await tx.inventory.deleteMany({ where: { partId: id } });

      // 2. Delete product-part relationships
      await tx.productPart.deleteMany({ where: { partId: id } });

      // 3. Delete purchase items referencing this part
      await tx.purchaseItem.deleteMany({ where: { partId: id } });

      // 4. Finally delete the part
      await tx.part.delete({ where: { id } });
    }, {
      timeout: 10000 // 10 seconds
    });

    res.json({ message: 'Part deleted successfully' });
  } catch (e) {
    const logger = require('../../config/logger');
    logger.error('Part Deletion Failed', { partId: id, error: e.message });
    res.status(500).json({ 
      message: 'Failed to delete part. It is likely linked to active products or purchases.',
      error: e.message 
    });
  }
};
