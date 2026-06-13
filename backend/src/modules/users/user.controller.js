// backend/src/modules/users/user.controller.js
const prisma = require('../../config/db');
const User = require('./user.model');
const bcrypt = require('bcryptjs');
const { sequentialOnHttp } = require('../../utils/sequentialOnHttp');
const { normalizeRole } = require('../../constants/roles');
const { assertPasswordPolicy } = require('../../utils/passwordPolicy');

const BRANCH_SCOPED = ['BRANCH_OWNER', 'BRANCH_MANAGER', 'EMPLOYEE'];

exports.getAll = async (req, res) => {
  try {
    let { branchId } = req.query;
    if (BRANCH_SCOPED.includes(normalizeRole(req.user.role))) {
      branchId = req.user.branchId;
    }
    const users = await User.getAllUsers(branchId ? Number(branchId) : undefined);
    res.json(users);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/** Users page — user list + branches for filters in one request. */
exports.getPageInit = async (req, res) => {
  try {
    let { branchId } = req.query;
    if (BRANCH_SCOPED.includes(normalizeRole(req.user.role))) {
      branchId = req.user.branchId;
    }

    const [users, branches] = await sequentialOnHttp([
      () => User.getAllUsers(branchId ? Number(branchId) : undefined),
      () =>
        req.user.role === 'COMPANY_OWNER'
          ? prisma.branch.findMany({
              take: 100,
              select: { id: true, name: true },
              orderBy: { name: 'asc' },
            })
          : Promise.resolve([]),
    ]);

    res.json({
      users,
      branches: req.user.role === 'COMPANY_OWNER' ? { data: branches } : undefined,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getOnlineCustomers = async (req, res) => {
  try {
    const { search, limit } = req.query;
    const customers = await User.searchOnlineCustomers(search, limit || 50);
    res.json({ data: customers });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, email, password, role, branchId } = req.body;
    assertPasswordPolicy(password);
    const normalizedRole = normalizeRole(role);

    const allowedRoles = ['COMPANY_OWNER', 'BRANCH_OWNER', 'BRANCH_MANAGER', 'EMPLOYEE', 'TECHNICIAN', 'CUSTOMER'];
    if (!allowedRoles.includes(normalizedRole)) {
      return res.status(400).json({ message: 'Invalid role.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let finalBranchId = branchId ? Number(branchId) : null;
    if (normalizeRole(req.user.role) === 'BRANCH_OWNER' || normalizeRole(req.user.role) === 'BRANCH_MANAGER') {
      finalBranchId = req.user.branchId;
    }

    const user = await User.createUser({
      name,
      email,
      password: hashedPassword,
      role: normalizedRole,
      branchId: finalBranchId,
    });
    res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, email, phone, branchId, role } = req.body;
    
    // Whitelist only safe fields for general updates
    const safeData = { name, email, phone };
    
    // Only COMPANY_OWNER can change role or branch assignment
    if (req.user.role === 'COMPANY_OWNER') {
      if (role) safeData.role = normalizeRole(role);
      if (branchId !== undefined) safeData.branchId = branchId ? Number(branchId) : null;
    }

    const userId = String(req.params.id || '').trim();
    if (!userId) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const user = await User.updateUser(userId, safeData);
    res.json(user);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const userId = String(req.params.id || '').trim();
    if (!userId) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const existing = await User.getUserById(userId);
    if (!existing) {
      return res.status(404).json({ message: 'User not found' });
    }

    await User.deleteUser(userId);
    res.json({ message: 'User removed successfully' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
