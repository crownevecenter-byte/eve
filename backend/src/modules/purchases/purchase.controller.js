// backend/src/modules/purchases/purchase.controller.js
const Purchase = require('./purchase.model');
const prisma = require('../../config/db');

exports.getAll = async (req, res) => {
  try {
    const query = { ...req.query };
    if (req.user.role === 'BRANCH_OWNER') {
      query.branchId = req.user.branchId;
    }
    const result = await Purchase.getPurchases(query);
    res.json(result);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { supplierId, branchId, total, items, remarks, documentNo, purchaseNo, partyInvoiceNo } = req.body;
    const purchase = await Purchase.createPurchase({
      supplierId: Number(supplierId),
      branchId: Number(branchId),
      total,
      items,
      remarks,
      documentNo,
      purchaseNo,
      partyInvoiceNo
    });
    res.status(201).json(purchase);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
