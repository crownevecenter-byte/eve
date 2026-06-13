// backend/src/modules/accounts/account-category.controller.js
const prisma = require('../../config/db');

// Get all categories for a branch (includes global ones where branchId is null)
exports.getAll = async (req, res) => {
  try {
    const { branchId } = req.query;
    const categories = await prisma.accountCategory.findMany({
      where: {
        OR: [
          { branchId: null },
          { branchId: branchId ? parseInt(branchId) : undefined }
        ]
      },
      include: {
        accounts: true
      },
      orderBy: { name: 'asc' }
    });
    res.json({ data: categories });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a new category
exports.create = async (req, res) => {
  try {
    const { name, description, branchId } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const category = await prisma.accountCategory.create({
      data: {
        name,
        description,
        branchId: branchId ? parseInt(branchId) : null
      }
    });
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update an existing category
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;

    const category = await prisma.accountCategory.update({
      where: { id },
      data: {
        name,
        description,
        status
      }
    });
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete a category
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    const accounts = await prisma.account.findMany({
      where: { categoryId: id }
    });

    for (const acc of accounts) {
      const vouchersCount = await prisma.voucher.count({
        where: {
          OR: [
            { fromAccountId: acc.id },
            { toAccountId: acc.id }
          ]
        }
      });

      if (vouchersCount > 0) {
        return res.status(400).json({ 
          message: `Cannot delete category. The account "${acc.account_name}" inside this category has financial vouchers attached.` 
        });
      }
    }

    await prisma.accountCategory.delete({
      where: { id }
    });

    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
