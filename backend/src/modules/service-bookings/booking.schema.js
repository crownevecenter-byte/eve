// backend/src/modules/appointments/appointment.schema.js
const { z } = require('zod');

const createAppointmentSchema = z.object({
  body: z.object({
    serviceId: z.number().int().positive(),
    branchId: z.number().int().positive(),
    scheduledAt: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" }),
    notes: z.string().optional(),
  })
});

const updateAppointmentStatusSchema = z.object({
  body: z.object({
    status: z.enum(['PENDING', 'BOOKED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
    techId: z.number().int().positive().optional(),
  })
});

module.exports = { createAppointmentSchema, updateAppointmentStatusSchema };
