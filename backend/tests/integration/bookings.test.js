const { describe, it, after } = require('node:test');
const assert = require('node:assert/strict');
const Booking = require('../../src/modules/service-bookings/booking.model');
const { tag, created, getBranch, getCustomer, getPrisma, cleanup } = require('../helpers/testContext');

describe('Service bookings (HTTP-safe)', () => {
  after(async () => {
    await cleanup();
  });

  it('creates booking without create+include', async () => {
    const prisma = getPrisma();
    const branch = await getBranch();
    const customer = await getCustomer();
    assert.ok(customer, 'Need seeded CUSTOMER user');

    let service = await prisma.service.findFirst({
      where: { branchId: branch.id },
      select: { id: true },
    });
    if (!service) {
      service = await prisma.service.create({
        data: {
          name: `Test Service ${tag()}`,
          service_type: 'maintenance',
          base_price: 500,
          branchId: branch.id,
          duration_minutes: 30,
        },
      });
    }

    const booking = await Booking.createBooking({
      customerId: customer.id,
      serviceId: service.id,
      branchId: branch.id,
      booking_date: new Date().toISOString(),
      booking_time: '10:00',
      status: 'pending',
      customer_notes: `Auto test ${tag()}`,
    });

    created.bookingIds.push(booking.id);
    assert.ok(booking.id);
    assert.ok(booking.customer);
    assert.ok(booking.service);
    assert.ok(booking.branch);
  });

  it('lists bookings for branch', async () => {
    const branch = await getBranch();
    const list = await Booking.getAllBookings({ branchId: branch.id });
    assert.ok(Array.isArray(list));
  });
});
