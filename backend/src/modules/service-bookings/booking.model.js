// backend/src/modules/service-bookings/booking.model.js
const prisma = require('../../config/db');
const { runInTransaction } = require('../../config/transaction');
const {
  normalizeStockItems,
  deductItemsStock,
  restoreItemsStock,
} = require('../inventory/stockMovement');

const COMPLETED_STATUSES = new Set(['COMPLETED', 'completed', 'done']);

const BOOKING_INCLUDE = { customer: true, service: true, branch: true };

const isCompletedStatus = (status) => COMPLETED_STATUSES.has(String(status || '').trim());

const getAllBookings = (filters = {}) => {
  const where = {};
  if (filters.branchId && !isNaN(Number(filters.branchId))) {
    where.branchId = Number(filters.branchId);
  }
  if (filters.customerId) where.customerId = filters.customerId;
  if (filters.status) where.status = filters.status;

  return prisma.serviceBooking.findMany({
    where,
    include: {
      customer: { select: { name: true, email: true, phone: true } },
      service: { select: { name: true, base_price: true } },
      branch: { select: { name: true, location: true, phone: true } }
    },
    orderBy: { booking_date: 'desc' }
  });
};

const getBookingById = (id) => prisma.serviceBooking.findUnique({
  where: { id },
  include: {
    customer: true,
    service: true,
  }
});

const createBooking = async (data) => {
  const {
    partsUsed,
    branchId,
    status = 'pending',
    booking_date,
    ...rest
  } = data;

  const items = normalizeStockItems(partsUsed);
  const shouldDeduct = isCompletedStatus(status) && items.length > 0;

  return runInTransaction(async (tx) => {
    if (shouldDeduct) {
      await deductItemsStock(tx, branchId, items);
    }

    const booking = await tx.serviceBooking.create({
      data: {
        ...rest,
        branchId: Number(branchId),
        status,
        booking_date: new Date(booking_date),
        partsUsed: items.length ? items : undefined,
        stockDeducted: shouldDeduct,
      },
    });
    return tx.serviceBooking.findUnique({
      where: { id: booking.id },
      include: BOOKING_INCLUDE,
    });
  }, {
    maxWait: 15000,
    timeout: 30000,
  });
};

const updateBooking = async (id, data) => {
  const updateData = { ...data };
  if (data.booking_date) updateData.booking_date = new Date(data.booking_date);

  const existing = await prisma.serviceBooking.findUnique({ where: { id } });
  if (!existing) throw new Error('Booking not found');

  const nextStatus = updateData.status ?? existing.status;
  const incomingParts = updateData.partsUsed !== undefined
    ? normalizeStockItems(updateData.partsUsed)
    : normalizeStockItems(existing.partsUsed);
  const wasCompleted = isCompletedStatus(existing.status);
  const willComplete = isCompletedStatus(nextStatus);

  return runInTransaction(async (tx) => {
    if (willComplete && !existing.stockDeducted && incomingParts.length > 0) {
      await deductItemsStock(tx, existing.branchId, incomingParts);
      updateData.stockDeducted = true;
      updateData.partsUsed = incomingParts;
    } else if (wasCompleted && !willComplete && existing.stockDeducted) {
      const partsToRestore = normalizeStockItems(existing.partsUsed);
      if (partsToRestore.length > 0) {
        await restoreItemsStock(tx, existing.branchId, partsToRestore);
      }
      updateData.stockDeducted = false;
    }

    await tx.serviceBooking.update({ where: { id }, data: updateData });
    return tx.serviceBooking.findUnique({ where: { id }, include: BOOKING_INCLUDE });
  }, {
    maxWait: 15000,
    timeout: 30000,
  });
};

const deleteBooking = async (id) => {
  return runInTransaction(async (tx) => {
    const booking = await tx.serviceBooking.findUnique({ where: { id } });
    if (!booking) throw new Error('Booking not found');

    if (booking.stockDeducted) {
      const partsToRestore = normalizeStockItems(booking.partsUsed);
      if (partsToRestore.length > 0) {
        await restoreItemsStock(tx, booking.branchId, partsToRestore);
      }
    }

    return tx.serviceBooking.delete({ where: { id } });
  }, {
    maxWait: 15000,
    timeout: 30000,
  });
};

const getTodayBookings = (branchId) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  return prisma.serviceBooking.findMany({
    where: {
      branchId: Number(branchId),
      booking_date: {
        gte: startOfToday,
        lte: endOfToday
      }
    },
    include: {
      customer: { select: { name: true } },
      service: { select: { name: true } }
    },
    orderBy: { booking_time: 'asc' }
  });
};

module.exports = {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking,
  getTodayBookings,
};
