// backend/src/modules/orders/order.schema.js
const { z } = require('zod');

const createOrderSchema = z.object({
  body: z.object({
    branchId: z.number().int().positive(),
    customerId: z.string().optional().nullable(),
    walkInCustomerId: z.string().optional().nullable(),
    bankId: z.string().optional().nullable(),
    type: z.enum(['POS', 'ONLINE']),
    payment_method: z.string().optional(),
    payment_status: z.string().optional(),
    payment_screenshot: z.string().optional().nullable(),
    transaction_id: z.string().optional().nullable(),
    tracking_id: z.string().optional().nullable(),
    customer_name: z.string().optional().nullable(),
    customer_phone: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    items: z.array(z.object({
      id: z.string().optional(),
      productId: z.string().optional(),
      qty: z.number().optional(),
      quantity: z.number().optional(),
      price: z.number().min(0),
    })).min(1),
    total: z.number().min(0),
  })
});

const updateStatusSchema = z.object({
  body: z.object({
    status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED']).optional(),
    payment_status: z.enum(['PENDING', 'PAID', 'REJECTED']).optional(),
    tracking_id: z.string().optional().nullable()
  })
});

module.exports = { createOrderSchema, updateStatusSchema };
