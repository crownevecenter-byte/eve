// backend/src/modules/service-categories/service-category.controller.js
const ServiceCategory = require('./service-category.model');

exports.getAll = async (req, res) => {
  try {
    const cats = await ServiceCategory.getAll();
    res.json(cats);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.create = async (req, res) => {
  try {
    const cat = await ServiceCategory.create(req.body);
    res.status(201).json(cat);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await ServiceCategory.remove(req.params.id);
    res.json({ message: 'Category deleted' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
