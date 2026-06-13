// backend/src/modules/brands/brand.controller.js
const prisma = require('../../config/db');

exports.getAll = async (req, res) => {
  try {
    const brands = await prisma.brand.findMany({ orderBy: { name: 'asc' } });
    res.json(brands);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, country, logo_url } = req.body;
    const brand = await prisma.brand.create({ data: { name, country, logo_url } });
    res.status(201).json(brand);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await prisma.brand.delete({ where: { id: req.params.id } });
    res.json({ message: 'Brand deleted' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
