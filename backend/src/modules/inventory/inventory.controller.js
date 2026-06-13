// backend/src/modules/inventory/inventory.controller.js
const Inventory = require('./inventory.model');

exports.getAll = async (req, res) => {
  try {
    const result = await Inventory.getBranchInventory(req.query);
    res.json(result);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/** Inventory page — list + summary in one request. */
exports.getPageBundle = async (req, res) => {
  try {
    let { branchId } = req.query;
    if (!branchId || branchId === 'undefined' || branchId === 'null') {
      branchId = req.user.branchId;
    }
    if (!branchId) return res.status(400).json({ message: 'Branch ID is required' });

    const bId = Number(branchId);
    const list = await Inventory.getBranchInventory(req.query);
    const summary = await Inventory.getInventorySummary(bId);
    res.json({ ...list, summary });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock, alertAt } = req.body;
    const inventory = await Inventory.updateStockById(Number(id), { stock, alertAt });
    res.json(inventory);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getAlerts = async (req, res) => {
  try {
    const { branchId, global } = req.query;
    const isGlobal = global === 'true';
    const inventory = await Inventory.getAlerts(branchId, isGlobal);
    // Filter items where stock is less than or equal to alertAt
    const alerts = inventory.filter(item => item.stock <= item.alertAt);
    res.json(alerts);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getSummary = async (req, res) => {
  try {
    let { branchId } = req.query;
    // Fallback to user's branchId if not in query
    if (!branchId || branchId === 'undefined' || branchId === 'null') {
      branchId = req.user.branchId;
    }
    
    if (!branchId) return res.status(400).json({ message: "Branch ID is required" });

    const summary = await Inventory.getInventorySummary(Number(branchId));
    res.json(summary);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

module.exports = exports;
