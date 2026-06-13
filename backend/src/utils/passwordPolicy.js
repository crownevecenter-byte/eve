const { z } = require('zod');

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

const assertPasswordPolicy = (password) => {
  const result = passwordSchema.safeParse(password);
  if (!result.success) {
    const message = result.error.issues?.[0]?.message || result.error.errors?.[0]?.message || 'Invalid password';
    const err = new Error(message);
    err.statusCode = 400;
    throw err;
  }
};

module.exports = { passwordSchema, assertPasswordPolicy };
