// backend/src/modules/service-bookings/booking.controller.js
const Booking = require('./booking.model');
const prisma = require('../../config/db');
const { sequentialOnHttp } = require('../../utils/sequentialOnHttp');

exports.getAll = async (req, res) => {
  try {
    const filters = { ...req.query };
    if (req.user.role === 'BRANCH_MANAGER' || req.user.role === 'BRANCH_OWNER') {
      if (req.user.branchId) {
        filters.branchId = req.user.branchId;
      }
    } else if (req.user.role === 'CUSTOMER') {
      filters.customerId = req.user.id;
    }
    const bookings = await Booking.getAllBookings(filters);
    res.json(bookings);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/** Appointments page — bookings + technicians in one request. */
exports.getPageInit = async (req, res) => {
  try {
    const filters = { ...req.query };
    const branchId = req.user.branchId;
    if (req.user.role === 'BRANCH_MANAGER' || req.user.role === 'BRANCH_OWNER') {
      if (branchId) filters.branchId = branchId;
    } else if (req.user.role === 'CUSTOMER') {
      filters.customerId = req.user.id;
    }

    const [appointments, technicians] = await sequentialOnHttp([
      () => Booking.getAllBookings(filters),
      () =>
        branchId
          ? prisma.user.findMany({
              where: { branchId: Number(branchId), role: 'TECHNICIAN' },
              select: { id: true, name: true, role: true, branchId: true },
              orderBy: { name: 'asc' },
            })
          : Promise.resolve([]),
    ]);

    res.json({ appointments, technicians });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const booking = await Booking.getBookingById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json(booking);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const STAFF_ROLES = new Set(['BRANCH_OWNER', 'BRANCH_MANAGER', 'EMPLOYEE']);

exports.create = async (req, res) => {
  try {
    let { serviceId } = req.body;
    const isStaff = STAFF_ROLES.has(req.user.role);

    // If no service selected (new simple form), find a default or create one
    if (!serviceId) {
      let defaultService = await prisma.service.findFirst({
        where: { name: 'General Maintenance' }
      });

      if (!defaultService) {
        const firstBranch = await prisma.branch.findFirst();
        defaultService = await prisma.service.create({
          data: {
            name: 'General Maintenance',
            service_type: 'maintenance',
            base_price: 0,
            branchId: req.body.branchId ? Number(req.body.branchId) : (firstBranch ? firstBranch.id : 1)
          }
        });
      }
      serviceId = defaultService.id;
    }

    const data = {
      ...req.body,
      serviceId,
      customerId: req.user.id,
      branchId: req.body.branchId ? Number(req.body.branchId) : req.user.branchId,
      status: isStaff && req.body.status ? req.body.status : 'pending',
    };

    const booking = await Booking.createBooking(data);
    res.status(201).json(booking);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.update = async (req, res) => {
  try {
    const booking = await Booking.updateBooking(req.params.id, req.body);
    res.json(booking);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await Booking.deleteBooking(req.params.id);
    res.json({ message: 'Booking deleted successfully' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getToday = async (req, res) => {
  try {
    const { branchId } = req.query;
    const bookings = await Booking.getTodayBookings(branchId);
    res.json(bookings);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
