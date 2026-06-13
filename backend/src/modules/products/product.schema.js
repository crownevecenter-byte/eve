// backend/src/modules/products/product.schema.js
const { z } = require('zod');

const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    product_type: z.enum(['bike', 'part']),
    description: z.string().optional().nullable(),
    price: z.number().positive(),
    sale_price: z.number().nullable().optional(),
    stock_qty: z.number().int().nonnegative().optional(),
    branchId: z.number().int().positive(),
    categoryId: z.string().uuid().nullable().optional(),
    brandId: z.string().uuid().nullable().optional(),
    is_active: z.boolean().optional(),
    images: z.array(z.any()).optional(),
    bikeDetail: z.any().optional(),
    partDetail: z.any().optional()
  }).passthrough()
});

const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    product_type: z.enum(['bike', 'part']).optional(),
    description: z.string().optional().nullable(),
    price: z.number().positive().optional(),
    sale_price: z.number().nullable().optional(),
    stock_qty: z.number().int().nonnegative().optional(),
    categoryId: z.string().uuid().nullable().optional(),
    brandId: z.string().uuid().nullable().optional(),
    is_active: z.boolean().optional(),
    images: z.array(z.any()).optional(),
    bikeDetail: z.any().optional(),
    partDetail: z.any().optional()
  }).passthrough()
});

module.exports = { createProductSchema, updateProductSchema };
