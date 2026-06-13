const prisma = require('../../config/db');

exports.getAll = async (req, res) => {
  try {
    const { branchId } = req.query;
    const banks = await prisma.bank.findMany({
      where: { branchId: branchId ? parseInt(branchId) : undefined },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ data: banks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, account_title, account_number, iban, branch_name, initial_balance, branchId } = req.body;
    
    if (!branchId) {
        return res.status(400).json({ message: 'Branch ID is required' });
    }

    const bank = await prisma.bank.create({
      data: {
        name,
        account_title,
        account_number,
        iban,
        branch_name,
        initial_balance: parseFloat(initial_balance) || 0,
        current_balance: parseFloat(initial_balance) || 0,
        branchId: parseInt(branchId)
      }
    });
    res.status(201).json(bank);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
