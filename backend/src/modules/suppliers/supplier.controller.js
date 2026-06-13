// backend/src/modules/suppliers/supplier.controller.js
const Supplier = require('./supplier.model');

exports.getAll = async (req, res) => {
  try {
    const result = await Supplier.getAllSuppliers(req.query);
    res.json(result);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.create = async (req, res) => {
  try {
    const supplier = await Supplier.createSupplier(req.body);
    res.status(201).json(supplier);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, contact } = req.body;
    if (!name?.trim() || !contact?.trim()) {
      return res.status(400).json({ message: 'Name and contact are required.' });
    }
    const supplier = await Supplier.updateSupplier(req.params.id, { name: name.trim(), contact: contact.trim() });
    res.json(supplier);
  } catch (e) {
    res.status(e.message === 'Supplier not found.' ? 404 : 500).json({ message: e.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await Supplier.deleteSupplier(req.params.id);
    res.json({ message: 'Supplier deleted successfully.' });
  } catch (e) {
    const status = e.message === 'Supplier not found.' ? 404 : 400;
    res.status(status).json({ message: e.message });
  }
};
