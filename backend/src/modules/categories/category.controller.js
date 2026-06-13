// backend/src/modules/categories/category.controller.js
const prisma = require('../../config/db');

exports.getAll = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: { parent: { select: { name: true } } },
      orderBy: { name: 'asc' }
    });
    res.json(categories);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, parent_id, description } = req.body;
    const category = await prisma.category.create({ 
      data: { name, parent_id: parent_id || null, description } 
    });
    res.status(201).json(category);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ message: 'Category deleted' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
